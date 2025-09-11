import {
  EvaluationContext,
  FlagNotFoundError,
  InvalidContextError,
  JsonValue,
  OpenFeatureEventEmitter,
  ParseError,
  Provider,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons,
  TargetingKeyMissingError,
  TrackingEventDetails
} from '@openfeature/server-sdk';
import { SplitFactory } from '@splitsoftware/splitio';
import type SplitIO from '@splitsoftware/splitio/types/splitio';

type SplitProviderOptions = {
  splitClient: SplitIO.IClient | SplitIO.IAsyncClient;
}

type Consumer = {
  key: string | undefined;
  attributes: SplitIO.Attributes;
};

const CONTROL_VALUE_ERROR_MESSAGE = 'Received the "control" value from Split.';
const CONTROL_TREATMENT = 'control';

export class OpenFeatureSplitProvider implements Provider {
  metadata = {
    name: 'split',
  };
  private initialized: Promise<void>;
  private client: SplitIO.IClient | SplitIO.IAsyncClient;

  public readonly events = new OpenFeatureEventEmitter();

  private getSplitClient(options: SplitProviderOptions | string | SplitIO.ISDK | SplitIO.IAsyncSDK) {
    if (typeof(options) === 'string') {
      const splitFactory = SplitFactory({core: { authorizationKey: options } });
      return splitFactory.client();
    } 

    let splitClient;
    try {
      splitClient = (options as SplitIO.ISDK | SplitIO.IAsyncSDK).client();
    } catch {
      splitClient = (options as SplitProviderOptions).splitClient
    }

    return splitClient;
  }
  
  constructor(options: SplitProviderOptions | string | SplitIO.ISDK | SplitIO.IAsyncSDK) {

    this.client = this.getSplitClient(options);

    this.client.on(this.client.Event.SDK_UPDATE, () => {
      this.events.emit(ProviderEvents.ConfigurationChanged)
    });
    this.initialized = new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((this.client as any).__getStatus().isReady) {
        console.log(`${this.metadata.name} provider initialized`);
        resolve();
      } else {
        this.client.on(this.client.Event.SDK_READY, () => {
          console.log(`${this.metadata.name} provider initialized`);
          resolve();
        });
      }
    });
  }

  async resolveBooleanEvaluation(
    flagKey: string,
    _: boolean,
    context: EvaluationContext
  ): Promise<ResolutionDetails<boolean>> {
    const details = await this.evaluateTreatment(
      flagKey,
      this.transformContext(context)
    );
    const treatment = details.value.toLowerCase();

    if ( treatment === 'on' || treatment === 'true' ) {
      return { ...details, value: true };
    }

    if ( treatment === 'off' || treatment === 'false' ) {
      return { ...details, value: false };
    }

    throw new ParseError(`Invalid boolean value for ${treatment}`);
  }

  async resolveStringEvaluation(
    flagKey: string,
    _: string,
    context: EvaluationContext
  ): Promise<ResolutionDetails<string>> {
    const details = await this.evaluateTreatment(
      flagKey,
      this.transformContext(context)
    );
    return details;
  }

  async resolveNumberEvaluation(
    flagKey: string,
    _: number,
    context: EvaluationContext
  ): Promise<ResolutionDetails<number>> {
    const details = await this.evaluateTreatment(
      flagKey,
      this.transformContext(context)
    );
    return { ...details, value: this.parseValidNumber(details.value) };
  }

  async resolveObjectEvaluation<U extends JsonValue>(
    flagKey: string,
    _: U,
    context: EvaluationContext
  ): Promise<ResolutionDetails<U>> {
    const details = await this.evaluateTreatment(
      flagKey,
      this.transformContext(context)
    );
    return { ...details, value: this.parseValidJsonObject(details.value) };
  }

  private async evaluateTreatment(
    flagKey: string,
    consumer: Consumer
  ): Promise<ResolutionDetails<string>> {
    if (!consumer.key) {
      throw new TargetingKeyMissingError(
        'The Split provider requires a targeting key.'
      );
    }
    if (flagKey == null || flagKey === '') {
      throw new FlagNotFoundError(
        'flagKey must be a non-empty string'
      );
    }

    await this.initialized;
    const { treatment: value, config }: SplitIO.TreatmentWithConfig = await this.client.getTreatmentWithConfig(
      consumer.key,
      flagKey,
      consumer.attributes
    );
    if (value === CONTROL_TREATMENT) {
      throw new FlagNotFoundError(CONTROL_VALUE_ERROR_MESSAGE);
    }
    const flagMetadata = { config: config ? config : '' };
    const details: ResolutionDetails<string> = {
      value: value,
      variant: value,
      flagMetadata: flagMetadata,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
    return details;
  }

  async track(
    trackingEventName: string,
    context: EvaluationContext,
    details: TrackingEventDetails
  ): Promise<void> {

    // targetingKey is always required
    const { targetingKey } = context;
    if (targetingKey == null || targetingKey === '')
      throw new TargetingKeyMissingError('Missing targetingKey, required to track');

    // eventName is always required
    if (trackingEventName == null || trackingEventName === '')
      throw new ParseError('Missing eventName, required to track');

    // trafficType is always required
    const ttVal = context['trafficType'];
    const trafficType =
      ttVal != null && typeof ttVal === 'string' && ttVal.trim() !== ''
        ? ttVal
        : null;
    if (trafficType == null || trafficType === '')
      throw new InvalidContextError('Missing trafficType variable, required to track');

    let value;
    let properties: SplitIO.Properties = {};
    if (details != null) {
      if (details.value != null) {
        value = details.value;
      }
      if (details.properties != null) {
        properties = details.properties as SplitIO.Properties;
      }
    } 

    this.client.track(targetingKey, trafficType, trackingEventName, value, properties);
  }

  async onClose?(): Promise<void> {
    return this.client.destroy();
  }

  //Transform the context into an object useful for the Split API, an key string with arbitrary Split 'Attributes'.
  private transformContext(context: EvaluationContext): Consumer {
    const { targetingKey, ...attributes } = context;
    return {
      key: targetingKey,
      // Stringify context objects include date.
      attributes: JSON.parse(JSON.stringify(attributes)),
    };
  }

  private parseValidNumber(stringValue: string | undefined) {
    if (stringValue === undefined) {
      throw new ParseError(`Invalid 'undefined' value.`);
    }
    const result = Number.parseFloat(stringValue);
    if (Number.isNaN(result)) {
      throw new ParseError(`Invalid numeric value ${stringValue}`);
    }
    return result;
  }

  private parseValidJsonObject<T extends JsonValue>(
    stringValue: string | undefined
  ): T {
    if (stringValue === undefined) {
      throw new ParseError(`Invalid 'undefined' JSON value.`);
    }
    // we may want to allow the parsing to be customized.
    try {
      const value = JSON.parse(stringValue);
      if (typeof value !== 'object') {
        throw new ParseError(
          `Flag value ${stringValue} had unexpected type ${typeof value}, expected "object"`
        );
      }
      return value;
    } catch (err) {
      throw new ParseError(`Error parsing ${stringValue} as JSON, ${err}`);
    }
  }
}

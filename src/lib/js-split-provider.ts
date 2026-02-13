import {
  EvaluationContext,
  EventDetails,
  FlagNotFoundError,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  ParseError,
  Provider,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons,
  TargetingKeyMissingError,
  TrackingEventDetails
} from '@openfeature/server-sdk';
import type SplitIO from '@splitsoftware/splitio/types/splitio';
import { getSplitClient } from './client-resolver';
import { transformContext } from './context';
import { parseValidJsonObject, parseValidNumber } from './parsers';
import { attachReadyEventHandlers, waitUntilReady } from './readiness';
import {
  CONTROL_TREATMENT,
  CONTROL_VALUE_ERROR_MESSAGE,
  DEFAULT_TRAFFIC_TYPE,
  PROVIDER_NAME,
  SplitProviderConstructorOptions,
  type Consumer
} from './types';

export class OpenFeatureSplitProvider implements Provider {
  readonly metadata = {
    name: PROVIDER_NAME,
  } as const;

  readonly runsOn = 'server' as const;

  private client: SplitIO.IClient | SplitIO.IAsyncClient;
  private trafficType: string;
  public readonly events = new OpenFeatureEventEmitter();

  constructor(
    options: SplitProviderConstructorOptions
  ) {
    this.trafficType = DEFAULT_TRAFFIC_TYPE;
    this.client = getSplitClient(options);

    attachReadyEventHandlers(this.client, this.events, this.metadata.name);

    this.client.on(
      this.client.Event.SDK_UPDATE,
      (updateMetadata: SplitIO.SdkUpdateMetadata) => {
        const eventDetails: EventDetails = {
          providerName: this.metadata.name,
          ...(updateMetadata
            ? {
                metadata: {
                  type: updateMetadata.type,
                  names: JSON.stringify(updateMetadata.names),
                },
                ...(updateMetadata.type === 'FLAGS_UPDATE'
                  ? { flagsChanged: updateMetadata.names }
                  : {}),
              }
            : {}),
        };
        this.events.emit(ProviderEvents.ConfigurationChanged, eventDetails);
      }
    );
  }

  /**
   * Called by the SDK after the provider is set. Waits for the Split client to be ready.
   * When this promise resolves, the SDK emits ProviderEvents.Ready.
   */
  async initialize(_context?: EvaluationContext): Promise<void> {
    void _context;
    await waitUntilReady(this.client, this.events, this.metadata.name);
  }

  public async resolveBooleanEvaluation(
    flagKey: string,
    _: boolean,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<boolean>> {
    void logger;
    const details = await this.evaluateTreatment(
      flagKey,
      transformContext(context, this.trafficType)
    );
    const treatment = details.value.toLowerCase();

    if (treatment === 'on' || treatment === 'true') {
      return { ...details, value: true };
    }
    if (treatment === 'off' || treatment === 'false') {
      return { ...details, value: false };
    }

    throw new ParseError(`Invalid boolean value for ${treatment}`);
  }

  public async resolveStringEvaluation(
    flagKey: string,
    _: string,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<string>> {
    void logger;
    return this.evaluateTreatment(
      flagKey,
      transformContext(context, this.trafficType)
    );
  }

  public async resolveNumberEvaluation(
    flagKey: string,
    _: number,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<number>> {
    void logger;
    const details = await this.evaluateTreatment(
      flagKey,
      transformContext(context, this.trafficType)
    );
    return { ...details, value: parseValidNumber(details.value) };
  }

  public async resolveObjectEvaluation<U extends JsonValue>(
    flagKey: string,
    _: U,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<U>> {
    void logger;
    const details = await this.evaluateTreatment(
      flagKey,
      transformContext(context, this.trafficType)
    );
    return { ...details, value: parseValidJsonObject<U>(details.value) };
  }

  private async evaluateTreatment(
    flagKey: string,
    consumer: Consumer
  ): Promise<ResolutionDetails<string>> {
    if (!consumer.targetingKey) {
      throw new TargetingKeyMissingError(
        'The Split provider requires a targeting key.'
      );
    }
    if (flagKey == null || flagKey === '') {
      throw new FlagNotFoundError('flagKey must be a non-empty string');
    }

    await waitUntilReady(this.client, this.events, this.metadata.name);
    const { treatment: value, config }: SplitIO.TreatmentWithConfig =
      await this.client.getTreatmentWithConfig(
        consumer.targetingKey,
        flagKey,
        consumer.attributes
      );
    if (value === CONTROL_TREATMENT) {
      throw new FlagNotFoundError(CONTROL_VALUE_ERROR_MESSAGE);
    }
    const flagMetadata = Object.freeze({ config: config ?? '' });
    return {
      value,
      variant: value,
      flagMetadata,
      reason: StandardResolutionReasons.TARGETING_MATCH,
    };
  }

  async track(
    trackingEventName: string,
    context: EvaluationContext,
    details: TrackingEventDetails
  ): Promise<void> {
    if (trackingEventName == null || trackingEventName === '') {
      throw new ParseError('Missing eventName, required to track');
    }

    const { targetingKey, trafficType } = transformContext(
      context,
      this.trafficType
    );
    if (targetingKey == null || targetingKey === '') {
      throw new TargetingKeyMissingError(
        'Missing targetingKey, required to track'
      );
    }

    let value: number | undefined;
    let properties: SplitIO.Properties = {};
    if (details != null) {
      if (details.value != null) {
        value = details.value;
      }
      if (details.properties != null) {
        properties = details.properties as SplitIO.Properties;
      }
    }

    this.client.track(
      targetingKey,
      trafficType,
      trackingEventName,
      value,
      properties
    );
  }

  public async onClose?(): Promise<void> {
    return this.client.destroy();
  }
}
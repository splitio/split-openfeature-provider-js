import {
  EvaluationContext,
  Provider,
  ResolutionDetails,
  ParseError,
  FlagNotFoundError,
  JsonValue,
  TargetingKeyMissingError,
  StandardResolutionReasons,
  TrackingEventDetails,
} from "@openfeature/server-sdk";
import type SplitIO from "@splitsoftware/splitio/types/splitio";

export interface SplitProviderOptions {
  splitClient: SplitIO.IClient;
}

type Consumer = {
  key: string | undefined;
  attributes: SplitIO.Attributes;
};

const CONTROL_VALUE_ERROR_MESSAGE = "Received the 'control' value from Split.";
const CONTROL_TREATMENT = "control";

export class OpenFeatureSplitProvider implements Provider {
  metadata = {
    name: "split",
  };
  private initialized: Promise<void>;
  private client: SplitIO.IClient;

  constructor(options: SplitProviderOptions) {
    this.client = options.splitClient;
    this.initialized = new Promise((resolve) => {
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
    const flagName = details.value.toLowerCase();

    if ( flagName === "on" || flagName === "true" ) {
      return { ...details, value: true };
    }

    if ( flagName === "off" || flagName === "false" ) {
      return { ...details, value: false };
    }

    throw new ParseError(`Invalid boolean value for ${flagName}`);
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
        "The Split provider requires a targeting key."
      );
    } else {
      await this.initialized;
      const {treatment: value, config}: SplitIO.TreatmentWithConfig = this.client.getTreatmentWithConfig(
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
  }

  async track(
    trackingEventName: string,
    context: EvaluationContext,
    details: TrackingEventDetails
  ): Promise<void> {

    // targetingKey is always required
    const { targetingKey } = context;
    if (targetingKey == null || targetingKey === "")
      throw new TargetingKeyMissingError();

    // eventName is always required
    if (trackingEventName == null || trackingEventName === "")
      throw new ParseError("Missing eventName, required to track");

    // trafficType is always required
    const ttVal = context["trafficType"];
    const trafficType =
      ttVal != null && typeof ttVal === "string" && ttVal.trim() !== ""
        ? ttVal
        : null;
    if (trafficType == null || trafficType === "")
      throw new ParseError("Missing trafficType variable, required to track");

    let value = 0;
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

  //Transform the context into an object useful for the Split API, an key string with arbitrary Split "Attributes".
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
      if (typeof value !== "object") {
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

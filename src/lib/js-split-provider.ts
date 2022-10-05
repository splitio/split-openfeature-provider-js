import {
  EvaluationContext,
  Provider,
  ResolutionDetails,
  ParseError,
  FlagNotFoundError,
  JsonValue,
  TargetingKeyMissingError,
  StandardResolutionReasons,
} from "@openfeature/js-sdk";
import type SplitIO from "@splitsoftware/splitio/types/splitio";

export interface SplitProviderOptions {
  splitClient: SplitIO.IClient;
}

type Consumer = {
  key: string | undefined;
  attributes: SplitIO.Attributes;
};

const CONTROL_VALUE_ERROR_MESSAGE = "Received the 'control' value from Split.";

export class OpenFeatureSplitProvider implements Provider {
  metadata = {
    name: "split",
  };
  private initialized: Promise<void>;
  private client: SplitIO.IClient;

  constructor(options: SplitProviderOptions) {
    this.client = options.splitClient;
    this.initialized = new Promise((resolve) => {
      this.client.on(this.client.Event.SDK_READY, () => {
        console.log(`${this.metadata.name} provider initialized`);
        resolve();
      });
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

    let value: boolean;
    switch (details.value as unknown) {
      case "on":
        value = true;
        break;
      case "off":
        value = false;
        break;
      case "true":
        value = true;
        break;
      case "false":
        value = false;
        break;
      case true:
        value = true;
        break;
      case false:
        value = false;
        break;
      case "control":
        throw new FlagNotFoundError(CONTROL_VALUE_ERROR_MESSAGE);
      default:
        throw new ParseError(`Invalid boolean value for ${details.value}`);
    }
    return { ...details, value };
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
    if (details.value === "control") {
      throw new FlagNotFoundError(CONTROL_VALUE_ERROR_MESSAGE);
    }
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
      const value = this.client.getTreatment(
        consumer.key,
        flagKey,
        consumer.attributes
      );
      const details: ResolutionDetails<string> = {
        value: value,
        variant: value,
        reason: StandardResolutionReasons.TARGETING_MATCH,
      };
      return details;
    }
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

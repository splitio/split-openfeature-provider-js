import { EvaluationContext, Provider, ResolutionDetails, TypeMismatchError, ParseError } from '@openfeature/nodejs-sdk';
import SplitIO from '@splitsoftware/splitio/types/splitio';

/**
 * This simple provider implementation relies on storing all data as strings in the treatment value.
 *
 * It may be more idiomatic to only rely on that for the "isEnabled" calls,
 * and for all values store the data in teh associated "split config" JSON.
 */
export interface SplitProviderOptions {
  splitClient: SplitIO.IClient;
}

type Consumer = {
  key: string;
  attributes: SplitIO.Attributes;
};

/**
 * NOTE: This is an unofficial provider that was created for demonstration
 * purposes only. The playground environment will be updated to use official
 * providers once they're available.
 */
export class OpenFeatureSplitProvider implements Provider {
  metadata = {
    name: 'split',
  };
  private initialized: Promise<void>;
  private client: SplitIO.IClient;

  constructor(options: SplitProviderOptions) {
    this.client = options.splitClient;
    // we don't expose any init events at the moment (we might later) so for now, lets create a private
    // promise to await into before we evaluate any flags.
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
    const details = await this.evaluateTreatment(flagKey, this.transformContext(context));

    let value: boolean;
    switch (details.value as unknown) {
      case 'on':
        value = true;
        break;
      case 'off':
        value = false;
        break;
      case 'true':
        value = true;
        break;
      case 'false':
        value = false;
        break;
      case true:
        value = true;
        break;
      case false:
        value = false;
        break;
      case 'control':
        console.log(`${this.metadata.name} provider returned control treatment for ${flagKey}`)
        value = false;
        break;
      default:
        throw new TypeMismatchError(`Invalid boolean value for ${details.value}`);
    }
    return { ...details, value };
  }

  async resolveStringEvaluation(
    flagKey: string,
    _: string,
    context: EvaluationContext
  ): Promise<ResolutionDetails<string>> {
    return this.evaluateTreatment(flagKey, this.transformContext(context));
  }

  async resolveNumberEvaluation(
    flagKey: string,
    _: number,
    context: EvaluationContext
  ): Promise<ResolutionDetails<number>> {
    const details = await this.evaluateTreatment(flagKey, this.transformContext(context));
    return { ...details, value: this.parseValidNumber(details.value) };
  }

  async resolveObjectEvaluation<U extends object>(
    flagKey: string,
    _: U,
    context: EvaluationContext
  ): Promise<ResolutionDetails<U>> {
    const details = await this.evaluateTreatment(flagKey, this.transformContext(context));
    return { ...details, value: this.parseValidJsonObject(details.value) };
  }

  private async evaluateTreatment(flagKey: string, consumer: Consumer): Promise<ResolutionDetails<string>> {
    await this.initialized;
    const value = this.client.getTreatment(consumer.key, flagKey, consumer.attributes);
    return { value };
  }

  //Transform the context into an object useful for the Split API, an key string with arbitrary Split "Attributes".
  private transformContext(context: EvaluationContext): Consumer {
    {
      const { targetingKey, ...attributes } = context;
      return {
        key: targetingKey || 'anonymous',
        // Stringify context objects include date.
        attributes: JSON.parse(JSON.stringify(attributes)),
      };
    }
  }

  private parseValidNumber(stringValue: string | undefined) {
    if (stringValue === undefined) {
      throw new ParseError(`Invalid 'undefined' value.`);
    }
    const result = Number.parseFloat(stringValue);
    if (Number.isNaN(result)) {
      throw new TypeMismatchError(`Invalid numeric value ${stringValue}`);
    }
    return result;
  }

  private parseValidJsonObject<T extends Object>(stringValue: string | undefined): T {
    if (stringValue === undefined) {
      throw new ParseError(`Invalid 'undefined' JSON value.`);
    }
    // we may want to allow the parsing to be customized.
    try {
      const value = JSON.parse(stringValue);
      if (typeof value !== 'object') {
        throw new TypeMismatchError(
          `Flag value ${stringValue} had unexpected type ${typeof value}, expected "object"`
        );
      }
      return value;
    } catch (err) {
      throw new ParseError(`Error parsing ${stringValue} as JSON, ${err}`);
    }
  }
}

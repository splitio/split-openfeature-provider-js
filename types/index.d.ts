// Declaration file for Javascript and Node OpenFeature Split Provider
// Project: http://www.split.io/

import { Provider } from "@openfeature/js-sdk";

export = SplitProvider;

declare module SplitProvider {
  export interface SplitProviderOptions {
    splitClient: SplitIO.IClient;
  }  

  /**
   * OpenFeature Split Provider constructor.
   */
  export function OpenFeatureSplitProvider(options: SplitProviderOptions): Provider;
}
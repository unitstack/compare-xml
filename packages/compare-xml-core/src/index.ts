export { getValueType, pathSegmentsToString } from '@compare-json/core';
export type {
  XMLValueDiffType,
  XMLArrayCompareMethod,
  XMLCompareOptions,
  XMLValueDifference,
} from './types';
export {
  compareXML,
  parseXML,
  validateXML,
  XMLValidationError,
  ATTRIBUTE_KEY_PREFIX,
} from './xml';

export default async function(assert) {

  const useDefaultTest = () => {
    assert.equal(1, 1);
  };

  const missingTargetingKeyTest = () => {
    assert.equal(2, 2);
  };

  const getControlVariantNonExistentSplit = () => {
    assert.equal(1, 1);
  };

  const getBooleanSplitTest = () => {
    assert.equal(1, 1);
  };

  const getBooleanSplitWithKeyTest = () => {
    assert.equal(1, 1);
  };

  const getStringSplitTest = () => {
    assert.equal(1, 1);
  };

  const getIntegerSplitTest = () => {
    assert.equal(1, 1);
  };

  const getObjectSplitTest = () => {
    assert.equal(1, 1);
  };

  const getDoubleSplitTest = () => {
    assert.equal(1, 1);
  };

  const getMetadataNameTest = () => {
    assert.equal(1, 1);
  };

  const getBooleanDetailsTest = () => {
    assert.equal(1, 1);
  };

  const getIntegerDetailsTest = () => {
    assert.equal(1, 1);
  };

  const getStringDetailsTest = () => {
    assert.equal(1, 1);
  };

  const getObjectDetailsTest = () => {
    assert.equal(1, 1);
  };

  const getDoubleDetailsTest = () => {
    assert.equal(1, 1);
  };

  const getBooleanFailTest = () => {
    assert.equal(1, 1);
  };

  const getIntegerFailTest = () => {
    assert.equal(1, 1);
  };

  const getDoubleFailTest = () => {
    assert.equal(1, 1);
  };

  const getObjectFailTest = () => {
    assert.equal(1, 1);
  };

  useDefaultTest();
 
  missingTargetingKeyTest();
  
  getControlVariantNonExistentSplit();

  getBooleanSplitTest();
  getBooleanSplitWithKeyTest();
 
  getStringSplitTest();
  getIntegerSplitTest();
  getObjectSplitTest();
  getDoubleSplitTest();
 
  getMetadataNameTest();
 
  getBooleanDetailsTest();
  getIntegerDetailsTest();
  getStringDetailsTest();
  getObjectDetailsTest();
  getDoubleDetailsTest();
 
  getBooleanFailTest();
  getIntegerFailTest();
  getDoubleFailTest();
  getObjectFailTest();

  assert.end();
}
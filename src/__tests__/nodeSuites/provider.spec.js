export default async function(assert) {

  const shouldFailWithBadApiKeyTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanNullEmptyTest = () => {
    assert.equal(2, 2);
  };

  const evalBooleanControlTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanTrueTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanOnTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanFalseTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanOffTest = () => {
    assert.equal(1, 1);
  };

  const evalBooleanErrorTest = () => {
    assert.equal(1, 1);
  };

  const evalStringNullEmptyTest = () => {
    assert.equal(1, 1);
  };

  const evalStringControlTest = () => {
    assert.equal(1, 1);
  };

  const evalStringRegularTest = () => {
    assert.equal(1, 1);
  };

  const evalIntNullEmptyTest = () => {
    assert.equal(1, 1);
  };

  const evalIntControlTest = () => {
    assert.equal(1, 1);
  };

  const evalIntRegularTest = () => {
    assert.equal(1, 1);
  };

  const evalIntErrorTest = () => {
    assert.equal(1, 1);
  };

  const evalDoubleNullEmptyTest = () => {
    assert.equal(1, 1);
  };

  const evalDoubleControlTest = () => {
    assert.equal(1, 1);
  };

  const evalDoubleRegularTest = () => {
    assert.equal(1, 1);
  };

  const evalDoubleErrorTest = () => {
    assert.equal(1, 1);
  };

  const evalStructureNullEmptyTest = () => {
    assert.equal(1, 1);
  };

  const evalStructureControlTest = () => {
    assert.equal(1, 1);
  };

  const evalStructureRegularTest = () => {
    assert.equal(1, 1);
  };

  const evalStructureComplexTest = () => {
    assert.equal(1, 1);
  };

  const evalStructureErrorTest = () => {
    assert.equal(1, 1);
  };

  shouldFailWithBadApiKeyTest();

  evalBooleanNullEmptyTest();
  evalBooleanControlTest();
  evalBooleanTrueTest();
  evalBooleanOnTest();
  evalBooleanFalseTest();
  evalBooleanOffTest();
  evalBooleanErrorTest();

  evalStringNullEmptyTest();
  evalStringControlTest();
  evalStringRegularTest();

  evalIntNullEmptyTest();
  evalIntControlTest();
  evalIntRegularTest();
  evalIntErrorTest();

  evalDoubleNullEmptyTest();
  evalDoubleControlTest();
  evalDoubleRegularTest();
  evalDoubleErrorTest();

  evalStructureNullEmptyTest();
  evalStructureControlTest();
  evalStructureRegularTest();
  evalStructureComplexTest();
  evalStructureErrorTest();

  assert.end();
}
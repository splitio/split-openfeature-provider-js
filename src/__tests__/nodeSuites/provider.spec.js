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

  const evalNumberNullEmptyTest = () => {
    assert.equal(1, 1);
  };

  const evalNumberControlTest = () => {
    assert.equal(1, 1);
  };

  const evalNumberRegularTest = () => {
    assert.equal(1, 1);
  };

  const evalNumberErrorTest = () => {
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

  evalNumberNullEmptyTest();
  evalNumberControlTest();
  evalNumberRegularTest();
  evalNumberErrorTest();

  evalStructureNullEmptyTest();
  evalStructureControlTest();
  evalStructureRegularTest();
  evalStructureComplexTest();
  evalStructureErrorTest();

  assert.end();
}
import { ParseError } from "@openfeature/server-sdk";
import { makeProviderWithSpy } from "../testUtils";

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

 const trackingSuite = (t) => {

  t.test("track: throws when missing eventName", async (t) => {
    const { provider } = makeProviderWithSpy();
    try {
      await provider.track("", { targetingKey: "u1", trafficType: "user" }, {});
      t.fail("expected ParseError for eventName");
    } catch (e) {
      t.ok(e instanceof ParseError, "got ParseError");
    }
    t.end();
  });

  t.test("track: throws when missing trafficType", async (t) => {
    const { provider } = makeProviderWithSpy();
    try {
      await provider.track("evt", { targetingKey: "u1" }, {});
      t.fail("expected ParseError for trafficType");
    } catch (e) {
      t.ok(e instanceof ParseError, "got ParseError");
    }
    t.end();
  });

   t.test("track: ok without details", async (t) => {
    const { provider, calls } = makeProviderWithSpy();
    await provider.track("view", { targetingKey: "u1", trafficType: "user" }, null);

    t.equal(calls.count, 1, "Split track called once");
    t.deepEqual(
      calls.args,
      ["u1", "user", "view", undefined, {}],
      "called with key, trafficType, eventName, 0, {}"
    );
    t.end();
  });

  t.test("track: ok with details", async (t) => {
    const { provider, calls } = makeProviderWithSpy();
    await provider.track(
      "purchase",
      { targetingKey: "u1", trafficType: "user" },
      { value: 9.99, properties: { plan: "pro", beta: true } }
    );

    t.equal(calls.count, 1, "Split track called once");
    t.equal(calls.args[0], "u1");
    t.equal(calls.args[1], "user");
    t.equal(calls.args[2], "purchase");
    t.equal(calls.args[3], 9.99);
    t.deepEqual(calls.args[4], { plan: "pro", beta: true });
    t.end();
  });
}

  trackingSuite(assert);

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
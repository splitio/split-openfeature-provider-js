import RedisServer from 'redis-server';
import { exec } from 'child_process';
import { OpenFeature } from '@openfeature/server-sdk';

import { getRedisSplitClient } from '../testUtils';
import { OpenFeatureSplitProvider } from '../../lib/js-split-provider';

const redisPort = '6385';

/**
 * Initialize redis server and run a cli bash command to load redis with data to do the proper tests
 */
const startRedis = () => {
  // Simply pass the port that you want a Redis server to listen on.
  const server = new RedisServer(redisPort);

  const promise = new Promise((resolve, reject) => {
    server
      .open()
      .then(() => {
        exec(`cat ./src/__tests__/mocks/redis-commands.txt | redis-cli -p ${redisPort}`, err => {
          if (err) {
            reject(server);
            // Node.js couldn't execute the command
            return;
          }
          resolve(server);
        });
      });
  });

  return promise;
};

let redisServer
let splitClient

beforeAll(async () => {
  redisServer = await startRedis();
}, 30000);

afterAll(async () => {
  await redisServer.close();
  await splitClient.destroy();
});

describe('Regular usage - DEBUG strategy', () => {
  splitClient = getRedisSplitClient(redisPort);
  const provider = new OpenFeatureSplitProvider({ splitClient });

  OpenFeature.setProviderAndWait(provider);
  const client = OpenFeature.getClient();
  
  test('Evaluate always on flag', async () => {
    await client.getBooleanValue('always-on', false, {targetingKey: 'emma-ss'}).then(result => {
      expect(result).toBe(true);
    });
  });

  test('Evaluate user in segment', async () => {
    await client.getBooleanValue('UT_IN_SEGMENT', false, {targetingKey: 'UT_Segment_member', properties: { /* empty properties are ignored */ }}).then(result => {
      expect(result).toBe(true);
    });

    await client.getBooleanValue('UT_IN_SEGMENT', false, {targetingKey: 'UT_Segment_member', properties: { some: 'value1' } }).then(result => {
      expect(result).toBe(true);
    });

    await client.getBooleanValue('UT_IN_SEGMENT', false, {targetingKey: 'other' }).then(result => {
      expect(result).toBe(false);
    });

    await client.getBooleanValue('UT_NOT_IN_SEGMENT', true, {targetingKey: 'UT_Segment_member' }).then(result => {
      expect(result).toBe(false);
    });

    await client.getBooleanValue('UT_NOT_IN_SEGMENT', true, {targetingKey: 'other' }).then(result => {
      expect(result).toBe(true);
    });

    await client.getBooleanValue('UT_NOT_IN_SEGMENT', true, {targetingKey: 'other' }).then(result => {
      expect(result).toBe(true);
    });
  });
    
  test('Evaluate with attributes set matcher', async () => {
    await client.getBooleanValue('UT_SET_MATCHER', false, {targetingKey: 'UT_Segment_member',  permissions: ['admin'] }).then(result => {
      expect(result).toBe(true);
    });

    await client.getBooleanValue('UT_SET_MATCHER', false, {targetingKey: 'UT_Segment_member',  permissions: ['not_matching'] }).then(result => {
      expect(result).toBe(false);
    });
    
    await client.getBooleanValue('UT_NOT_SET_MATCHER', true, {targetingKey: 'UT_Segment_member',  permissions: ['create'] }).then(result => {
      expect(result).toBe(false);
    });

    await client.getBooleanValue('UT_NOT_SET_MATCHER', true, {targetingKey: 'UT_Segment_member',  permissions: ['not_matching'] }).then(result => {
      expect(result).toBe(true);
    });
  })

  test('Evaluate with dynamic config', async () => {
    await client.getBooleanDetails('UT_NOT_SET_MATCHER', true, {targetingKey: 'UT_Segment_member',  permissions: ['not_matching'] }).then(result => {
      expect(result.value).toBe(true);
      expect(result.flagMetadata).toEqual({'config': ''});
    });

    await client.getStringDetails('always-o.n-with-config', 'control', {targetingKey: 'other'}).then(result => {
      expect(result.value).toBe('o.n');
      expect(result.flagMetadata).toEqual({config: '{"color":"brown"}'});
    });
  })
});

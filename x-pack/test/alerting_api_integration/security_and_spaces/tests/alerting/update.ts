/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';
import { getTestAlertData } from './utils';
import { UserAtSpaceScenarios } from '../../scenarios';
import { getUrlPrefix, ObjectRemover } from '../../../common/lib';
import { FtrProviderContext } from '../../../common/ftr_provider_context';

// eslint-disable-next-line import/no-default-export
export default function createUpdateTests({ getService }: FtrProviderContext) {
  const supertest = getService('supertest');
  const supertestWithoutAuth = getService('supertestWithoutAuth');

  describe('update', () => {
    const objectRemover = new ObjectRemover(supertest);

    after(() => objectRemover.removeAll());

    for (const scenario of UserAtSpaceScenarios) {
      const { user, space } = scenario;
      describe(scenario.id, () => {
        it('should handle update alert request appropriately', async () => {
          const { body: createdAlert } = await supertest
            .post(`${getUrlPrefix(space.id)}/api/alert`)
            .set('kbn-xsrf', 'foo')
            .send(getTestAlertData())
            .expect(200);
          objectRemover.add(space.id, createdAlert.id, 'alert');

          const updatedData = {
            alertTypeParams: {
              foo: true,
            },
            interval: '12s',
            actions: [],
          };
          const response = await supertestWithoutAuth
            .put(`${getUrlPrefix(space.id)}/api/alert/${createdAlert.id}`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send(updatedData);

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
              expect(response.statusCode).to.eql(404);
              expect(response.body).to.eql({
                statusCode: 404,
                error: 'Not Found',
                message: 'Not Found',
              });
              break;
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.statusCode).to.eql(200);
              expect(response.body).to.eql({
                ...updatedData,
                id: createdAlert.id,
                updatedBy: user.username,
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should handle update alert request appropriately when attempting to change alert type', async () => {
          const { body: createdAlert } = await supertest
            .post(`${getUrlPrefix(space.id)}/api/alert`)
            .set('kbn-xsrf', 'foo')
            .send(getTestAlertData())
            .expect(200);
          objectRemover.add(space.id, createdAlert.id, 'alert');

          const response = await supertestWithoutAuth
            .put(`${getUrlPrefix(space.id)}/api/alert/${createdAlert.id}`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({
              alertTypeId: '1',
              alertTypeParams: {
                foo: true,
              },
              interval: '12s',
              actions: [],
            });

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
              expect(response.statusCode).to.eql(404);
              expect(response.body).to.eql({
                statusCode: 404,
                error: 'Not Found',
                message: 'Not Found',
              });
              break;
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.statusCode).to.eql(400);
              expect(response.body).to.eql({
                statusCode: 400,
                error: 'Bad Request',
                message: '"alertTypeId" is not allowed',
                validation: {
                  source: 'payload',
                  keys: ['alertTypeId'],
                },
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('should handle update alert request appropriately when payload is empty and invalid', async () => {
          const response = await supertestWithoutAuth
            .put(`${getUrlPrefix(space.id)}/api/alert/1`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({});

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
              expect(response.statusCode).to.eql(404);
              expect(response.body).to.eql({
                statusCode: 404,
                error: 'Not Found',
                message: 'Not Found',
              });
              break;
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.statusCode).to.eql(400);
              expect(response.body).to.eql({
                statusCode: 400,
                error: 'Bad Request',
                message:
                  'child "interval" fails because ["interval" is required]. child "alertTypeParams" fails because ["alertTypeParams" is required]. child "actions" fails because ["actions" is required]',
                validation: {
                  source: 'payload',
                  keys: ['interval', 'alertTypeParams', 'actions'],
                },
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it(`should handle update alert request appropriately when alertTypeConfig isn't valid`, async () => {
          const { body: createdAlert } = await supertest
            .post(`${getUrlPrefix(space.id)}/api/alert`)
            .set('kbn-xsrf', 'foo')
            .send(
              getTestAlertData({
                alertTypeId: 'test.validation',
                alertTypeParams: {
                  param1: 'test',
                },
              })
            )
            .expect(200);
          objectRemover.add(space.id, createdAlert.id, 'alert');

          const response = await supertestWithoutAuth
            .put(`${getUrlPrefix(space.id)}/api/alert/${createdAlert.id}`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send({
              interval: '10s',
              alertTypeParams: {},
              actions: [],
            });

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
              expect(response.statusCode).to.eql(404);
              expect(response.body).to.eql({
                statusCode: 404,
                error: 'Not Found',
                message: 'Not Found',
              });
              break;
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.statusCode).to.eql(400);
              expect(response.body).to.eql({
                statusCode: 400,
                error: 'Bad Request',
                message:
                  'alertTypeParams invalid: [param1]: expected value of type [string] but got [undefined]',
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });

        it('sshould handle update alert request appropriately when interval is wrong syntax', async () => {
          const response = await supertestWithoutAuth
            .put(`${getUrlPrefix(space.id)}/api/alert/1`)
            .set('kbn-xsrf', 'foo')
            .auth(user.username, user.password)
            .send(getTestAlertData({ interval: '10x', enabled: undefined }));

          switch (scenario.id) {
            case 'no_kibana_privileges at space1':
            case 'space_1_all at space2':
            case 'global_read at space1':
              expect(response.statusCode).to.eql(404);
              expect(response.body).to.eql({
                statusCode: 404,
                error: 'Not Found',
                message: 'Not Found',
              });
              break;
            case 'superuser at space1':
            case 'space_1_all at space1':
              expect(response.statusCode).to.eql(400);
              expect(response.body).to.eql({
                statusCode: 400,
                error: 'Bad Request',
                message:
                  'child "interval" fails because ["interval" with value "10x" fails to match the seconds pattern, "interval" with value "10x" fails to match the minutes pattern, "interval" with value "10x" fails to match the hours pattern, "interval" with value "10x" fails to match the days pattern]. "alertTypeId" is not allowed',
                validation: {
                  source: 'payload',
                  keys: ['interval', 'interval', 'interval', 'interval', 'alertTypeId'],
                },
              });
              break;
            default:
              throw new Error(`Scenario untested: ${JSON.stringify(scenario)}`);
          }
        });
      });
    }
  });
}

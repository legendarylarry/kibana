/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Request } from 'hapi';

interface UiSettings {
  get: (value: string) => string;
}

type SavedObjectClient = any;

// these types shoud be in core kibana and are only here temporarily
export interface KbnServer {
  info: { protocol: string };
  config: () => ConfigObject;
  expose: () => void;
  plugins: Record<string, any>;
  route: any;
  log: any;
  fieldFormatServiceFactory: (uiConfig: any) => any;
  savedObjects: {
    getScopedSavedObjectsClient: (fakeRequest: {
      headers: object;
      getBasePath: () => string;
    }) => SavedObjectClient;
  };
  uiSettingsServiceFactory: ({
    savedObjectsClient,
  }: {
    savedObjectsClient: SavedObjectClient;
  }) => UiSettings;
}

export interface ConfigObject {
  get: (path?: string) => any;
}

export interface ElementPosition {
  boundingClientRect: {
    // modern browsers support x/y, but older ones don't
    top: number;
    left: number;
    width: number;
    height: number;
  };
  scroll: {
    x: number;
    y: number;
  };
}

export interface ConditionalHeaders {
  headers: Record<string, string>;
  conditions: ConditionalHeadersConditions;
}

export interface ConditionalHeadersConditions {
  protocol: string;
  hostname: string;
  port: number;
  basePath: string;
}

export interface CryptoFactory {
  decrypt: (headers?: Record<string, string>) => string;
}

export interface TimeRangeParams {
  timezone: string;
  min: Date | string | number;
  max: Date | string | number;
}

// retain POST payload data, needed for async
export interface JobParamPostPayload {
  timerange: TimeRangeParams;
}

// params that come into a request
export interface JobParams {
  savedObjectType: string;
  savedObjectId: string;
  isImmediate: boolean;
}

export interface JobDocPayload {
  basePath?: string;
  forceNow?: string;
  headers?: Record<string, string>;
  jobParams: JobParams;
  relativeUrl?: string;
  timeRange?: any;
  title: string;
  type: string | null;
  urls?: string[];
}

export interface JobDocOutput {
  content: string; // encoded content
  contentType: string;
}

export interface JobDoc {
  jobtype: string;
  output: JobDocOutput;
  payload: JobDocPayload;
  status: string; // completed, failed, etc
}

export interface JobSource {
  _id: string;
  _source: JobDoc;
}

/*
 * A snake_cased field is the only significant difference in structure of
 * JobDocOutputExecuted vs JobDocOutput.
 *
 * JobDocOutput is the structure of the object returned by getDocumentPayload
 *
 * data in the _source fields of the
 * Reporting index.
 *
 * The ESQueueWorker internals have executed job objects returned with this
 * structure. See `_formatOutput` in reporting/server/lib/esqueue/worker.js
 */
export interface JobDocOutputExecuted {
  content_type: string; // vs `contentType` above
  content: string | null; // defaultOutput is null
  max_size_reached: boolean;
  size: number;
}

export interface ESQueueWorker {
  on: (event: string, handler: any) => void;
}

export type ESQueueCreateJobFn = (
  jobParams: JobParams,
  headers: ConditionalHeaders,
  request: Request
) => Promise<JobParams>;

export type ESQueueWorkerExecuteFn = (job: JobDoc, cancellationToken: any) => void;
export type ImmediateExecuteFn = (
  jobDocPayload: JobDocPayload,
  request: Request
) => Promise<JobDocOutputExecuted>;

export interface ESQueueWorkerOptions {
  kibanaName: string;
  kibanaId: string;
  interval: number;
  intervalErrorMultiplier: number;
}

export interface ESQueueInstance {
  registerWorker: (
    jobtype: string,
    workerFn: any,
    workerOptions: ESQueueWorkerOptions
  ) => ESQueueWorker;
}

export type CreateJobFactory = (server: KbnServer) => ESQueueCreateJobFn;
export type ExecuteJobFactory = (server: KbnServer) => ESQueueWorkerExecuteFn;
export type ExecuteImmediateJobFactory = (server: KbnServer) => ImmediateExecuteFn;

export interface ExportTypeDefinition {
  id: string;
  name: string;
  jobType: string;
  jobContentExtension: string;
  createJobFactory: CreateJobFactory;
  executeJobFactory: ExecuteJobFactory | ExecuteImmediateJobFactory;
  validLicenses: string[];
}

export interface ExportType {
  jobType: string;
  createJobFactory: any;
  executeJobFactory: (server: KbnServer) => ESQueueWorkerExecuteFn;
}

export interface ExportTypesRegistry {
  register: (exportTypeDefinition: ExportTypeDefinition) => void;
}

export { LevelLogger as Logger } from './server/lib/level_logger';

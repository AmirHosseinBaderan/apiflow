import { defineStore } from 'pinia';
import type { ExecutionResult } from '@domain/test/TestResult';
import type { RequestDefinition } from '@domain/request/RequestDefinition';
import type { VariableBundle } from '@domain/variable/VariableScope';
import type { Workflow, WorkflowExecutionResult } from '@domain/workflow/Workflow';
import { WorkflowEngine } from '@application/workflows/WorkflowEngine';
import type { RequestExecutionService } from '@application/requests/RequestExecutionService';

export const useExecutionStore = defineStore('execution', {
  state: () => ({
    running: false,
    lastResult: null as ExecutionResult | null,
    workflowResult: null as WorkflowExecutionResult | null,
    history: [] as ExecutionResult[],
    runtimeVariables: [] as VariableBundle['runtime'],
    service: null as RequestExecutionService | null,
    error: null as string | null,
  }),

  getters: {
    bundleFor(state) {
      return (collectionVars: VariableBundle['collection']): VariableBundle => ({
        collection: collectionVars,
        request: [],
        runtime: [...state.runtimeVariables],
      });
    },
  },

  actions: {
    bindService(service: RequestExecutionService) {
      this.service = service;
    },
    async run(request: RequestDefinition, collectionVars: VariableBundle['collection']) {
      if (!this.service) return;
      this.running = true;
      this.error = null;
      try {
        const bundle = this.bundleFor(collectionVars);
        const result = await this.service.execute({ request, bundle });
        this.lastResult = result;
        this.history = [result, ...this.history].slice(0, 50);
        const map = new Map(this.runtimeVariables.map((v) => [v.key, v]));
        for (const [k, v] of Object.entries(result.extractedVariables)) {
          map.set(k, { key: k, value: v, enabled: true, secret: false });
        }
        this.runtimeVariables = Array.from(map.values());
      } catch (e) {
        this.error = (e as Error).message;
      } finally {
        this.running = false;
      }
    },
    async runWorkflow(
      workflow: Workflow,
      requests: ReadonlyArray<RequestDefinition>,
      collectionVars: VariableBundle['collection'],
      runTests?: boolean,
    ) {
      const service = this.service;
      if (!service) return;
      this.running = true;
      this.error = null;
      try {
        const bundle = this.bundleFor(collectionVars);
        const engine = new WorkflowEngine(service);
        const result = await engine.run({ workflow, requests, initialBundle: bundle, runTests });
        this.workflowResult = result;
        this.running = false;
        return result;
      } catch (e) {
        this.error = (e as Error).message;
        this.running = false;
        return null;
      }
    },
    clearRuntime() {
      this.runtimeVariables = [];
    },
  },
});

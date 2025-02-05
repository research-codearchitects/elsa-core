import {h} from '@stencil/core';
import {createElsaWorkflowSettingsClient, SaveWorkflowSettingsRequest} from "../services/elsa-client";
import {eventBus, ElsaPlugin, ElsaClient} from "../../../services";
import {
  EventTypes,
  ConfigureWorkflowRegistryColumnsContext,
  ConfigureWorkflowRegistryUpdatingContext,
  ElsaStudio
} from "../../../models";

export class WorkflowSettingsPlugin implements ElsaPlugin {
  serverUrl: string;
  elsaClient: ElsaClient;

  constructor(elsaStudio: ElsaStudio) {
    this.serverUrl = elsaStudio.serverUrl;
    this.elsaClient = elsaStudio.elsaClientFactory();

    eventBus.on(EventTypes.WorkflowRegistryLoadingColumns, this.onLoadingColumns);
    eventBus.on(EventTypes.WorkflowRegistryUpdating, this.onUpdating);
  }

  onLoadingColumns(context: ConfigureWorkflowRegistryColumnsContext) {
    const headers: any[] = [["Enabled"]];
    const hasContextItems: boolean = true;

    context.data = {headers, hasContextItems};
  }

  async onUpdating(context: ConfigureWorkflowRegistryUpdatingContext) {

    const elsaClient = createElsaWorkflowSettingsClient(this.serverUrl);
    const workflowSettings = await elsaClient.workflowSettingsApi.list();

    const workflowBlueprintSettings = workflowSettings.find(x => x.workflowBlueprintId == context.params[0] && x.key == context.params[1]);
    if (workflowBlueprintSettings != undefined)
      await elsaClient.workflowSettingsApi.delete(workflowBlueprintSettings.id);

    const request: SaveWorkflowSettingsRequest = {
      workflowBlueprintId: context.params[0],
      key: context.params[1],
      value: context.params[2]
    };

    await elsaClient.workflowSettingsApi.save(request);
    eventBus.emit(EventTypes.WorkflowRegistryUpdated, this);
  }
}

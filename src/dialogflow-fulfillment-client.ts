// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...
import { Request, Response } from 'express'
import { google } from '@google-cloud/dialogflow/build/protos/protos'

/**
 * Simply wraps a nice interface over the webhook API. `WebhookClient` takes in an Express.js request and response.
 * @example
 * ```ts
 * import WebhookClient from "dialogflow-fulfillment-client";
 *
 * app.get("/webhook",(req,res)=>{
 *  const agent = WebhookClient(req,res);
 *
 *  agent.add("Some Fulfillment Text");
 *
 *  const handleWelcomeIntent = (agent) => {
 *    agent.add("Dear User! Welcome");
 *  }
 *
 *  const handleOtherIntent = async (agent) => {
 *    await someAsyncTask();
 *    agent.add("Other task handled");
 *  }
 *
 *  const intentMap = {
 *    "WelcomeIntent": handleWelcomeIntent,
 *    "AnotherIntent": handleOtherIntent
 *  };
 *
 *  agent.handleRequest(intentMap);
 * });
 *
 * ```
 *
 * @export
 * @class WebhookClient
 */
export default class WebhookClient {
  /**
   *  An Express Request object
   *
   * @type {Request}
   * @memberof WebhookClient
   */
  readonly request: Request

  /**
   *  An Exress Response object
   *
   * @type {Response}
   * @memberof WebhookClient
   */
  response: Response

  private webhookRequestBody: google.cloud.dialogflow.v2.WebhookRequest

  private webhookResponseBody: google.cloud.dialogflow.v2.WebhookResponse = {} as google.cloud.dialogflow.v2.WebhookResponse

  constructor(request: Request, response: Response) {
    this.request = request
    this.response = response

    this.webhookRequestBody = request.body
    this.webhookResponseBody.fulfillmentMessages = this.webhookRequestBody.queryResult
      ?.fulfillmentMessages as google.cloud.dialogflow.v2.Intent.IMessage[]
    this.webhookResponseBody.outputContexts = this.webhookRequestBody.queryResult
      ?.outputContexts as google.cloud.dialogflow.v2.IContext[]
  }

  public get responseId(): string {
    return this.webhookRequestBody?.responseId ?? null
  }

  public get session(): string {
    return this.webhookRequestBody?.session ?? null
  }

  public get query() {
    return this.webhookRequestBody?.queryResult?.queryText ?? null
  }

  public get parameters() {
    return this.webhookRequestBody?.queryResult?.parameters ?? null
  }

  public get allRequiredParamsPresent() {
    return this.webhookRequestBody?.queryResult?.allRequiredParamsPresent ?? null
  }

  public get fulfillmentText() {
    return this.webhookRequestBody?.queryResult?.fulfillmentText ?? null
  }

  public get fulfillmentMessages() {
    return this.webhookRequestBody?.queryResult?.fulfillmentMessages ?? null
  }

  public get outputContexts() {
    return this.webhookRequestBody?.queryResult?.outputContexts ?? null
  }

  public get intent() {
    return this.webhookRequestBody?.queryResult?.intent ?? null
  }

  public get intentDetectionConfidence() {
    return this.webhookRequestBody?.queryResult?.intentDetectionConfidence ?? null
  }

  public get diagnosticInfo() {
    return this.webhookRequestBody?.queryResult?.diagnosticInfo ?? null
  }

  public get languageCode() {
    return this.webhookRequestBody?.queryResult?.languageCode ?? null
  }

  public get originalDetectIntentRequest() {
    return this.webhookRequestBody?.originalDetectIntentRequest ?? null
  }

  public add(response: string | string[]) {
    if (typeof response === 'string') {
      this.webhookResponseBody.fulfillmentMessages?.push({
        text: { text: [response] }
      })
    } else if (this.isStringArray(response)) {
      for (const responseText of response) {
        this.webhookResponseBody.fulfillmentMessages?.push({
          text: { text: [responseText] }
        })
      }
    }
  }

  public clearFulfillments() {
    this.webhookResponseBody.fulfillmentMessages = []
    return
  }

  public addContext(
    context: google.cloud.dialogflow.v2.Context | google.cloud.dialogflow.v2.Context[]
  ) {
    if (context instanceof google.cloud.dialogflow.v2.Context) {
      this.webhookResponseBody.outputContexts.push(context)
    } else {
      this.webhookResponseBody.outputContexts.push(...context)
    }
  }

  public clearContexts() {
    this.webhookResponseBody.outputContexts = []
    return
  }

  /**
   * Takes in a `Record` where `key` is your intent name and `value` is a function that takes in a parameter of type `WebhookClient`.
   *
   * @example
   * ```ts
   * const client = WebhookClient(request,response);
   *
   * client.handleRequest({"Start":handleStartIntent});
   *
   * function handleStartIntent(agent){
   *  agent.add("Some fulfillment text");
   * }
   * ```
   *  This method will return a response back to dialogflow when done. Be sure to pass a
   *  function that returns a promise if you need to do some asynchronous task.
   *
   * @example
   * ```ts
   *  client.handleRequest({
   *    "Start":handleStartIntent,
   *    "BookTicketIntent":handleBookIntent,
   *  });
   *
   * async function handleBookIntent(agent){
   *  await someAsyncTask();
   *  agent.add("Ticket Booked");
   * }
   * ```
   * @param {Record<string, (agent: WebhookClient) => any>} intentMap
   * @memberof WebhookClient
   */
  public async handleRequest(intentMap: Record<string, (agent: WebhookClient) => any>) {
    await intentMap[this.webhookRequestBody?.queryResult?.intent?.displayName as string](this)

    this.response.send(this.webhookResponseBody)
  }

  private isStringArray(obj: string[]): obj is string[] {
    return obj?.length > 0
  }
}

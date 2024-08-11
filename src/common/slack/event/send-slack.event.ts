export class SendSlackMessageEvent {
  constructor(
    public readonly channel: string,
    public readonly text: string,
  ) {}
}

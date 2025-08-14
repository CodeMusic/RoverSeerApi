export const DEFAULT_WELCOME_MESSAGE = "Welcome to the chat!.";

export const WITTY_ERROR_REPLIES: string[] = [
  "My muse tripped over a cable. Mind trying that again?",
  "The ideas are brewing, but the kettle overflowed. Let's give it another shot.",
  "I asked the automation elves. They took a coffee break. Try once more?",
  "I blinked and the network vanished. One more time, and I’ll keep my eyes open.",
  "I’m playing 4D chess with the server—currently in check. Try again?",
  "I tried to be clever, the server tried to be offline. We tied. Can we retry?",
  "I’m stuck in a thought loop. A fresh prompt might free me.",
  "Musai’s orchestra is tuning. Give me another cue?",
  "I reached out to n8n, but it ghosted me. Want to try again?",
  "The cosmic router rolled a natural 1. Let’s reroll that request."
];

export function getRandomWittyError(): string {
  return WITTY_ERROR_REPLIES[Math.floor(Math.random() * WITTY_ERROR_REPLIES.length)];
}
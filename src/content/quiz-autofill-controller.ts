import {
  applyAutoFill,
  buildAutoFillPrompt,
  detectQuizDom
} from "./quiz-autofill";
import type { QuizControllerOptions } from "./quiz-shared";
import { runQuizRequest } from "./quiz-shared";

export function createQuizAutofillController(options: QuizControllerOptions) {
  return {
    async runQuizAutofill(): Promise<void> {
      await runQuizRequest(options, {
        userMessage: "📸 Screenshot sent — answering quiz and auto-filling…",
        buildPrompt: () => {
          const snapshot = detectQuizDom();

          return {
            prompt: buildAutoFillPrompt(snapshot),
            onResponse: (response) => {
              applyAutoFill(snapshot, response);
            }
          };
        }
      });
    }
  };
}

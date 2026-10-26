import type { Question } from '../types/question'
export function explainQuestion(question: Question): string {
  const { firstOperand: a, secondOperand: b, correctAnswer: answer } = question
  switch (question.operation) {
    case 'addition':
      return `Combine ${a} and ${b} to make ${answer}.`
    case 'subtraction':
      return `Take ${b} away from ${a} to leave ${answer}.`
    case 'multiplication':
      return `${a} groups of ${b} make ${answer}.`
    case 'division':
      return `Split ${a} into ${b} equal groups. Each group has ${answer}.`
  }
}

import type { Question } from '../types/question'
export function spokenQuestion(question: Question): string {
  const operation = {
    addition: 'plus',
    subtraction: 'minus',
    multiplication: 'times',
    division: 'divided by',
  }[question.operation]
  return `${question.firstOperand} ${operation} ${question.secondOperand} equals what?`
}

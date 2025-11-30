import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Réponse à une question du test
export class QuestionReponseDto {
  @IsNotEmpty()
  questionId: number;

  @IsNotEmpty()
  reponse: any; // Peut être string, number, array selon le type de question
}

export class SubmitTestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionReponseDto)
  reponses: QuestionReponseDto[];
}
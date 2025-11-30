import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, Role } from '../entities/user.entity';
import { TestFormateur, TestStatus } from '../entities/test-formateur.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { SubmitTestDto } from './dto/submit-test.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(TestFormateur)
    private testFormateurRepository: Repository<TestFormateur>,
  ) {}

  // ========================================
  // CRUD USERS
  // ========================================

  // Récupérer tous les utilisateurs (Admin seulement)
  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'email', 'nom', 'prenom', 'telephone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  // Récupérer un utilisateur par ID
  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'nom', 'prenom', 'telephone', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  // Mettre à jour un utilisateur
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si changement d'email, vérifier qu'il n'existe pas déjà
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Si changement de mot de passe, le hasher
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    const { password, ...result } = user;
    return result as User;
  }

  // Supprimer un utilisateur (Admin seulement)
  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    await this.userRepository.remove(user);
  }

  // ========================================
  // TEST FORMATEUR
  // ========================================

  // Questions du test formateur (hardcodées pour l'instant)
  getTestQuestions() {
    return {
      message: 'Test de compétences pour devenir formateur',
      duree: 30, // minutes
      scoreMinimum: 70, // sur 100
      questions: [
        {
          id: 1,
          type: 'qcm',
          question: 'Quelle est la principale responsabilité d\'un formateur BTP ?',
          points: 10,
          options: [
            'Gérer les finances du chantier',
            'Former et encadrer les apprenants',
            'Acheter les matériaux',
            'Superviser uniquement la sécurité',
          ],
          correctAnswer: 1, // Index de la bonne réponse
        },
        {
          id: 2,
          type: 'qcm',
          question: 'Quel équipement de sécurité est obligatoire sur un chantier ?',
          points: 10,
          options: [
            'Casque uniquement',
            'Casque, chaussures de sécurité, gilet',
            'Gants uniquement',
            'Aucun équipement',
          ],
          correctAnswer: 1,
        },
        {
          id: 3,
          type: 'text',
          question: 'Expliquez en 2-3 phrases comment vous organiseriez une formation sur la maçonnerie pour débutants.',
          points: 20,
          // Cette question sera évaluée manuellement ou avec un système de mots-clés
        },
        {
          id: 4,
          type: 'qcm',
          question: 'Quelle est la première étape avant de commencer un chantier ?',
          points: 10,
          options: [
            'Commencer les travaux immédiatement',
            'Faire un plan et vérifier les autorisations',
            'Acheter tous les matériaux',
            'Embaucher l\'équipe',
          ],
          correctAnswer: 1,
        },
        {
          id: 5,
          type: 'qcm',
          question: 'Combien de temps faut-il généralement pour former un apprenti maçon ?',
          points: 10,
          options: [
            '1 semaine',
            '1 mois',
            '6 mois à 2 ans',
            '5 ans',
          ],
          correctAnswer: 2,
        },
        {
          id: 6,
          type: 'multiple',
          question: 'Quels sont les outils essentiels d\'un maçon ? (plusieurs réponses possibles)',
          points: 15,
          options: [
            'Truelle',
            'Niveau à bulle',
            'Perceuse',
            'Fer à souder',
            'Fil à plomb',
          ],
          correctAnswers: [0, 1, 2, 4], // Indices des bonnes réponses
        },
        {
          id: 7,
          type: 'qcm',
          question: 'Quelle certification est souvent requise pour enseigner dans le BTP ?',
          points: 10,
          options: [
            'Aucune certification nécessaire',
            'CAP ou équivalent + expérience professionnelle',
            'Uniquement un diplôme universitaire',
            'Permis de conduire',
          ],
          correctAnswer: 1,
        },
        {
          id: 8,
          type: 'text',
          question: 'Décrivez une situation difficile que vous avez gérée sur un chantier et comment vous l\'avez résolue.',
          points: 15,
          // Question ouverte
        },
      ],
    };
  }

  // Soumettre le test formateur
  async submitTest(userId: string, submitTestDto: SubmitTestDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que l'utilisateur n'a pas déjà passé le test avec succès
    const existingTest = await this.testFormateurRepository.findOne({
      where: { userId },
    });

    if (existingTest && existingTest.status === TestStatus.PASSED) {
      throw new BadRequestException('Vous avez déjà réussi le test formateur');
    }

    // Calculer le score
    const testQuestions = this.getTestQuestions();
    let score = 0;

    submitTestDto.reponses.forEach((reponse) => {
      const question = testQuestions.questions.find((q) => q.id === reponse.questionId);

      if (!question) return;

      if (question.type === 'qcm') {
        if (reponse.reponse === question.correctAnswer) {
          score += question.points;
        }
      } else if (question.type === 'multiple') {
        const userAnswers = Array.isArray(reponse.reponse) ? reponse.reponse : [];
        const correctAnswers = question.correctAnswers || [];

        // Score proportionnel aux bonnes réponses
        const correctCount = userAnswers.filter((ans) => correctAnswers.includes(ans)).length;
        const incorrectCount = userAnswers.length - correctCount;

        if (incorrectCount === 0 && correctCount === correctAnswers.length) {
          score += question.points;
        } else if (correctCount > 0) {
          score += (question.points * correctCount) / correctAnswers.length;
        }
      }
      // Pour les questions 'text', on donne des points par défaut (à améliorer avec IA)
      else if (question.type === 'text' && reponse.reponse && reponse.reponse.length > 20) {
        score += question.points * 0.7; // 70% des points si réponse substantielle
      }
    });

    // Arrondir le score
    score = Math.round(score);

    // Déterminer le statut
    const status = score >= testQuestions.scoreMinimum ? TestStatus.PASSED : TestStatus.FAILED;

    // Créer ou mettre à jour le test
    if (existingTest) {
      existingTest.score = score;
      existingTest.status = status;
      existingTest.reponses = submitTestDto.reponses as any;
      existingTest.passedAt = status === TestStatus.PASSED ? new Date() : null;
      await this.testFormateurRepository.save(existingTest);
    } else {
      const newTest = this.testFormateurRepository.create({
        userId,
        score,
        status,
        reponses: submitTestDto.reponses as any,
        passedAt: status === TestStatus.PASSED ? new Date() : null,
      });
      await this.testFormateurRepository.save(newTest);
    }

    // Si le test est réussi, promouvoir l'utilisateur en FORMATEUR
    if (status === TestStatus.PASSED) {
      user.role = Role.FORMATEUR;
      await this.userRepository.save(user);
    }

    return {
      message: status === TestStatus.PASSED 
        ? 'Félicitations ! Vous êtes maintenant formateur.' 
        : 'Test échoué. Vous pouvez réessayer.',
      score,
      scoreMinimum: testQuestions.scoreMinimum,
      status,
      role: user.role,
    };
  }

  // Récupérer le résultat du test d'un utilisateur
  async getTestResult(userId: string) {
    const test = await this.testFormateurRepository.findOne({
      where: { userId },
    });

    if (!test) {
      throw new NotFoundException('Aucun test trouvé pour cet utilisateur');
    }

    return test;
  }
}
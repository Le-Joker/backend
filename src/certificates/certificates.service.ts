import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inscription } from '../entities/inscription.entity';
import { User } from '../entities/user.entity';
import { Formation } from '../entities/formation.entity';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

interface CertificateData {
  studentName: string;
  formationTitle: string;
  formateurName: string;
  completionDate: Date;
  duration: number;
  score?: number;
}

@Injectable()
export class CertificatesService {
  constructor(
    @InjectRepository(Inscription)
    private inscriptionRepository: Repository<Inscription>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Formation)
    private formationRepository: Repository<Formation>,
  ) {}

  async generateCertificate(inscriptionId: string): Promise<string> {
    const inscription = await this.inscriptionRepository.findOne({
      where: { id: inscriptionId },
      relations: ['etudiant', 'formation', 'formation.formateur'],
    });

    if (!inscription) {
      throw new NotFoundException('Inscription non trouvée');
    }

    if (inscription.progression < 100) {
      throw new Error('La formation doit être complétée à 100%');
    }

    const certificateData: CertificateData = {
      studentName: `${inscription.etudiant.prenom} ${inscription.etudiant.nom}`,
      formationTitle: inscription.formation.titre,
      formateurName: `${inscription.formation.formateur.prenom} ${inscription.formation.formateur.nom}`,
      completionDate: inscription.dateCompletion || new Date(),
      duration: inscription.formation.duree,
      score: inscription.note || undefined,
    };

    const filename = await this.createPDF(certificateData, inscriptionId);
    return filename;
  }

  private async createPDF(
    data: CertificateData,
    inscriptionId: string,
  ): Promise<string> {
    const certificatesDir = path.join(process.cwd(), 'uploads', 'certificates');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
    }

    const filename = `certificate-${inscriptionId}-${Date.now()}.pdf`;
    const filepath = path.join(certificatesDir, filename);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const stream = fs.createWriteStream(filepath);
      doc.pipe(stream);

      // Fond dégradé
      doc
        .rect(0, 0, doc.page.width, doc.page.height)
        .fill('#f0f9ff');

      // Bordure décorative
      doc
        .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
        .lineWidth(3)
        .stroke('#2563eb');

      doc
        .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
        .lineWidth(1)
        .stroke('#60a5fa');

      // Logo INTELLECT BUILDING
      doc
        .fontSize(32)
        .fillColor('#1e40af')
        .font('Helvetica-Bold')
        .text('INTELLECT BUILDING', 0, 80, {
          align: 'center',
          width: doc.page.width,
        });

      doc
        .fontSize(16)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Plateforme de Formation BTP', 0, 120, {
          align: 'center',
          width: doc.page.width,
        });

      // Titre CERTIFICAT
      doc
        .fontSize(48)
        .fillColor('#1e3a8a')
        .font('Helvetica-Bold')
        .text('CERTIFICAT', 0, 180, {
          align: 'center',
          width: doc.page.width,
        });

      doc
        .fontSize(18)
        .fillColor('#475569')
        .font('Helvetica')
        .text('DE RÉUSSITE', 0, 240, {
          align: 'center',
          width: doc.page.width,
        });

      // Nom de l'étudiant
      doc
        .fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Ce certificat est décerné à', 0, 300, {
          align: 'center',
          width: doc.page.width,
        });

      doc
        .fontSize(32)
        .fillColor('#0f172a')
        .font('Helvetica-Bold')
        .text(data.studentName, 0, 330, {
          align: 'center',
          width: doc.page.width,
        });

      // Formation
      doc
        .fontSize(14)
        .fillColor('#64748b')
        .font('Helvetica')
        .text('Pour avoir complété avec succès la formation', 0, 390, {
          align: 'center',
          width: doc.page.width,
        });

      doc
        .fontSize(20)
        .fillColor('#1e40af')
        .font('Helvetica-Bold')
        .text(data.formationTitle, 100, 420, {
          align: 'center',
          width: doc.page.width - 200,
        });

      // Informations complémentaires
      const infoY = 480;
      doc
        .fontSize(12)
        .fillColor('#475569')
        .font('Helvetica')
        .text(`Durée: ${data.duration} heures`, 0, infoY, {
          align: 'center',
          width: doc.page.width,
        });

      if (data.score) {
        doc.text(`Note finale: ${data.score}/20`, 0, infoY + 20, {
          align: 'center',
          width: doc.page.width,
        });
      }

      doc.text(
        `Date de complétion: ${data.completionDate.toLocaleDateString('fr-FR')}`,
        0,
        infoY + (data.score ? 40 : 20),
        {
          align: 'center',
          width: doc.page.width,
        },
      );

      // Signature
      doc
        .fontSize(12)
        .fillColor('#64748b')
        .font('Helvetica-Italic')
        .text(`Formateur: ${data.formateurName}`, 100, 540, {
          width: 200,
        });

      doc
        .moveTo(100, 570)
        .lineTo(300, 570)
        .stroke('#94a3b8');

      // ID unique
      doc
        .fontSize(10)
        .fillColor('#94a3b8')
        .font('Helvetica')
        .text(`ID: ${inscriptionId}`, 0, doc.page.height - 80, {
          align: 'center',
          width: doc.page.width,
        });

      doc.end();

      stream.on('finish', () => {
        resolve(`/uploads/certificates/${filename}`);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async getCertificatePath(inscriptionId: string): Promise<string> {
    // Vérifier si un certificat existe déjà
    const certificatesDir = path.join(process.cwd(), 'uploads', 'certificates');
    const files = fs.readdirSync(certificatesDir);
    const existingCert = files.find(f => f.includes(inscriptionId));

    if (existingCert) {
      return `/uploads/certificates/${existingCert}`;
    }

    // Sinon, le générer
    return this.generateCertificate(inscriptionId);
  }
}
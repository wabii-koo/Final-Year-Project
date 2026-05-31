import * as fs from 'fs';
import * as path from 'path';
import { sequelize } from '../src/database/connection';
import { StudentModel } from '../src/models/Student';
import { ClassroomModel } from '../src/models/Classroom';

async function autoImport() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Database.');

    const csvPath = path.join(__dirname, '../../students_template.csv');
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at: ${csvPath}`);
      process.exit(1);
    }

    const csvText = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');

    if (lines.length < 2) {
      console.error('CSV file has no data.');
      process.exit(1);
    }

    const headers = lines[0].split(',').map(h =>
      h.trim().toLowerCase().replace(/[\s_-]+/g, '')
    );

    const getField = (cols: string[], keys: string[]): string => {
      for (const key of keys) {
        const idx = headers.indexOf(key);
        if (idx !== -1 && cols[idx]) return cols[idx].trim();
      }
      return '';
    };

    let successful = 0;
    let duplicates = 0;
    let failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());

      const firstName = getField(cols, ['firstname', 'first']);
      const lastName = getField(cols, ['lastname', 'last']);
      const fullName = getField(cols, ['fullname', 'name']) || `${firstName} ${lastName}`.trim();
      const dob = getField(cols, ['dob', 'dateofbirth', 'birthdate']);
      const emergencyContact = getField(cols, ['emergencycontact', 'contact', 'phone', 'emergency']) || 'N/A';
      const classLevelStr = getField(cols, ['classlevel', 'classroom', 'class', 'grade', 'level']);

      if (!fullName || !dob || !classLevelStr) {
        console.log(`Row ${i + 1}: Skipped due to missing required fields (Name: ${fullName}, DOB: ${dob}, Class: ${classLevelStr})`);
        failed++;
        continue;
      }

      // Find Classroom
      const classroom = await ClassroomModel.findOne({
        where: { classLevel: classLevelStr } as any
      });

      if (!classroom) {
        console.error(`Row ${i + 1} (${fullName}): Classroom "${classLevelStr}" not found in DB!`);
        failed++;
        continue;
      }

      const classId = (classroom as any).classId;

      // Duplicate Check
      const existing = await StudentModel.findOne({
        where: { fullName, dob } as any
      });

      if (existing) {
        console.log(`Row ${i + 1} (${fullName}): Student already exists (Skipped).`);
        duplicates++;
        continue;
      }

      // Create Student
      await StudentModel.create({
        fullName,
        dob,
        emergencyContact,
        classId,
        guardianId: null
      } as any);

      console.log(`Row ${i + 1} (${fullName}): Successfully imported into classroom "${classLevelStr}".`);
      successful++;
    }

    console.log(`\nImport Summary: ${successful} added, ${duplicates} duplicates, ${failed} failed.`);
    process.exit(0);

  } catch (error) {
    console.error('Import failed with error:', error);
    process.exit(1);
  }
}

autoImport();

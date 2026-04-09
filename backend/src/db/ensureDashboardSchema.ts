import type { Sequelize } from "sequelize";

/** MySQL ER_DUP_FIELDNAME — column already exists */
const MYSQL_DUP_FIELDNAME = 1060;

async function addColumnIfMissing(
  sequelize: Sequelize,
  sql: string,
  label: string,
): Promise<void> {
  try {
    await sequelize.query(sql);
    console.info(`[db] Added column ${label}`);
  } catch (e: unknown) {
    const errno = (e as { parent?: { errno?: number } })?.parent?.errno;
    if (errno !== MYSQL_DUP_FIELDNAME) {
      throw e;
    }
  }
}

/**
 * Dashboard-related tables and additive `students` columns.
 * Safe on every startup (idempotent).
 */
export async function ensureDashboardSchema(sequelize: Sequelize): Promise<void> {
  if (sequelize.getDialect() !== "mysql") {
    return;
  }

  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN gender VARCHAR(20) NULL",
    "students.gender",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN roll_number VARCHAR(32) NULL",
    "students.roll_number",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN section_name VARCHAR(80) NULL",
    "students.section_name",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN passport_photo_filename VARCHAR(255) NULL",
    "students.passport_photo_filename",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN nationality VARCHAR(100) NULL",
    "students.nationality",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN country_code VARCHAR(10) NULL",
    "students.country_code",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN district VARCHAR(120) NULL",
    "students.district",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN registration_type VARCHAR(24) NOT NULL DEFAULT 'first'",
    "students.registration_type",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN middle_name VARCHAR(100) NULL",
    "students.middle_name",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN previous_school VARCHAR(200) NULL",
    "students.previous_school",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN previous_school_location VARCHAR(200) NULL",
    "students.previous_school_location",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN last_class_attended VARCHAR(120) NULL",
    "students.last_class_attended",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN last_term_year VARCHAR(40) NULL",
    "students.last_term_year",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN previous_report_card_filename VARCHAR(255) NULL",
    "students.previous_report_card_filename",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN previous_grades VARCHAR(200) NULL",
    "students.previous_grades",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN transfer_reason VARCHAR(120) NULL",
    "students.transfer_reason",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN parent_alive_status VARCHAR(16) NULL",
    "students.parent_alive_status",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN parent_full_name VARCHAR(120) NULL",
    "students.parent_full_name",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN parent_phone VARCHAR(32) NULL",
    "students.parent_phone",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN parent_address VARCHAR(255) NULL",
    "students.parent_address",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN religion VARCHAR(80) NULL",
    "students.religion",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN special_needs VARCHAR(255) NULL",
    "students.special_needs",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN boarding_status VARCHAR(16) NULL",
    "students.boarding_status",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN residence_address VARCHAR(255) NULL",
    "students.residence_address",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN medical_info TEXT NULL",
    "students.medical_info",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN emergency_contact_name VARCHAR(120) NULL",
    "students.emergency_contact_name",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN emergency_contact_phone VARCHAR(32) NULL",
    "students.emergency_contact_phone",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN guardian_name VARCHAR(120) NULL",
    "students.guardian_name",
  );
  await addColumnIfMissing(
    sequelize,
    "ALTER TABLE students ADD COLUMN guardian_phone VARCHAR(32) NULL",
    "students.guardian_phone",
  );

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS staff_members (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NULL,
      display_name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NULL,
      staff_role VARCHAR(40) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY staff_members_role_idx (staff_role),
      KEY staff_members_user_idx (user_id),
      CONSTRAINT fk_staff_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      subject VARCHAR(255) NOT NULL,
      message_body TEXT NOT NULL,
      source_email VARCHAR(255) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'open',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY enquiries_status_idx (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS notice_board_entries (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      author_user_id INT UNSIGNED NULL,
      author_label VARCHAR(120) NOT NULL,
      body TEXT NOT NULL,
      published_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY notice_board_published_idx (published_at),
      CONSTRAINT fk_notice_board_author FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS school_expenses (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      reference_code VARCHAR(32) NOT NULL,
      expense_type VARCHAR(120) NOT NULL,
      amount_ugx BIGINT NOT NULL,
      status VARCHAR(20) NOT NULL,
      contact_email VARCHAR(255) NOT NULL,
      expense_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_school_expenses_ref (reference_code),
      KEY school_expenses_date_idx (expense_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS school_events (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      event_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY school_events_date_idx (event_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS dashboard_chart_points (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      sort_order INT NOT NULL DEFAULT 0,
      x_pos INT NOT NULL,
      y_pos INT NOT NULL,
      PRIMARY KEY (id),
      KEY dashboard_chart_sort_idx (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS social_platform_stats (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      platform_key VARCHAR(32) NOT NULL,
      display_label VARCHAR(64) NOT NULL,
      follower_count INT UNSIGNED NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (id),
      UNIQUE KEY uq_social_platform_key (platform_key),
      KEY social_sort_idx (sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      student_id INT UNSIGNED NOT NULL,
      record_date DATE NOT NULL,
      present TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY attendance_student_date_idx (student_id, record_date),
      KEY attendance_date_idx (record_date),
      CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS dashboard_kpis (
      kpi_key VARCHAR(64) NOT NULL,
      value_text VARCHAR(120) NOT NULL,
      PRIMARY KEY (kpi_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

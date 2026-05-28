-- Digital Parent-School Communication System Database Schema (PostgreSQL/Supabase)

-- Drop types if they exist to allow re-running
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS relationship_type CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;
DROP TYPE IF EXISTS priority_type CASCADE;
DROP TYPE IF EXISTS recipient_group_type CASCADE;
DROP TYPE IF EXISTS delivery_status_type CASCADE;
DROP TYPE IF EXISTS event_type_enum CASCADE;
DROP TYPE IF EXISTS target_audience_type CASCADE;
DROP TYPE IF EXISTS tracking_status CASCADE;
DROP TYPE IF EXISTS report_card_status CASCADE;
DROP TYPE IF EXISTS pickup_status CASCADE;
DROP TYPE IF EXISTS delivery_method_type CASCADE;

-- Create Custom Types
CREATE TYPE user_role AS ENUM ('director', 'registrar', 'teacher', 'homeroom_teacher', 'guardian');
CREATE TYPE relationship_type AS ENUM ('parent', 'legal_guardian');
CREATE TYPE registration_status AS ENUM ('pending', 'approved', 'rejected', 'correction_required');
CREATE TYPE priority_type AS ENUM ('normal', 'emergency');
CREATE TYPE recipient_group_type AS ENUM ('all_guardians', 'all_teachers', 'specific_class', 'specific_users');
CREATE TYPE delivery_status_type AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE event_type_enum AS ENUM ('exam', 'meeting', 'holiday', 'activity', 'other');
CREATE TYPE target_audience_type AS ENUM ('all', 'guardians_only', 'teachers_only', 'specific_class');
CREATE TYPE tracking_status AS ENUM ('assigned', 'viewed', 'completed');
CREATE TYPE report_card_status AS ENUM ('pending', 'approved', 'unlocked');
CREATE TYPE pickup_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE delivery_method_type AS ENUM ('in_app', 'email', 'sms');

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    phone_no VARCHAR(15) NOT NULL,
    address VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON Users(email);
CREATE INDEX idx_users_role ON Users(role);

-- GuardianRegistration Table
CREATE TABLE IF NOT EXISTS GuardianRegistration (
    registration_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    status registration_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reg_status ON GuardianRegistration(status);
CREATE INDEX idx_reg_user_id ON GuardianRegistration(user_id);

-- Classrooms Table
CREATE TABLE IF NOT EXISTS Classrooms (
    class_id SERIAL PRIMARY KEY,
    teacher_id INT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    class_level VARCHAR(20) NOT NULL,
    homeroom_teacher_id INT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    academic_year VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_class_teacher ON Classrooms(teacher_id);

-- Students Table
CREATE TABLE IF NOT EXISTS Students (
    student_id SERIAL PRIMARY KEY,
    guardian_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    class_id INT NOT NULL REFERENCES Classrooms(class_id) ON DELETE RESTRICT,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    emergency_contact VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_guardian ON Students(guardian_id);
CREATE INDEX idx_student_class ON Students(class_id);

-- Messages Table
CREATE TABLE IF NOT EXISTS Messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    message_type VARCHAR(20) DEFAULT 'general'
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS Notifications (
    notification_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    priority priority_type NOT NULL DEFAULT 'normal',
    sender_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    recipient_group recipient_group_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_status delivery_status_type DEFAULT 'pending'
);

-- Events Table
CREATE TABLE IF NOT EXISTS Events (
    event_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type event_type_enum NOT NULL,
    location VARCHAR(255),
    created_by INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience target_audience_type DEFAULT 'all'
);

-- Homework Table
CREATE TABLE IF NOT EXISTS Homework (
    homework_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES Students(student_id) ON DELETE CASCADE,
    teacher_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    subject VARCHAR(50) NOT NULL,
    instructions TEXT NOT NULL,
    due_date DATE,
    assigned_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- HomeworkTracking Table
CREATE TABLE IF NOT EXISTS HomeworkTracking (
    tracking_id SERIAL PRIMARY KEY,
    homework_id INT NOT NULL REFERENCES Homework(homework_id) ON DELETE CASCADE,
    guardian_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    feedback_given_at TIMESTAMP WITH TIME ZONE,
    status tracking_status DEFAULT 'assigned'
);

-- ReportCards Table
CREATE TABLE IF NOT EXISTS ReportCards (
    reportcard_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES Students(student_id) ON DELETE CASCADE,
    term VARCHAR(20) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    filled_by INT NOT NULL REFERENCES Users(user_id) ON DELETE RESTRICT,
    filled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status report_card_status DEFAULT 'pending',
    approved_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    subjects_grades JSONB,
    teacher_comments TEXT,
    principal_comments TEXT,
    attendance_record JSONB,
    conduct_grade VARCHAR(50),
    overall_grade VARCHAR(50)
);

-- PickupRequests Table
CREATE TABLE IF NOT EXISTS PickupRequests (
    request_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES Students(student_id) ON DELETE CASCADE,
    guardian_id INT NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    authorized_person_name VARCHAR(100) NOT NULL,
    authorized_person_relationship VARCHAR(50) NOT NULL,
    authorized_person_phone VARCHAR(15) NOT NULL,
    authorized_person_national_id VARCHAR(50) NOT NULL,
    status pickup_status NOT NULL DEFAULT 'pending',
    request_date DATE NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time_start VARCHAR(20),
    pickup_time_end VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_by INT REFERENCES Users(user_id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- SystemLogs Table
CREATE TABLE IF NOT EXISTS SystemLogs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES Users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data
INSERT INTO Users (email, password_hash, role, full_name, phone_no, address) VALUES
('director@school.com', '$2b$12$LQv3c1yqBvV1hGdVxF5KqY1KqY1KqY1KqY1KqY1KqY1KqY1KqY', 'director', 'School Director', '251911111111', 'School Address'),
('registrar@school.com', '$2b$12$92VUNxDfQ1r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'registrar', 'School Registrar', '251911222222', 'School Address'),
('teacher@school.com', '$2b$12$7xY9zW2vQ3r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'teacher', 'Ms. Smith Teacher', '251911333333', 'School Address'),
('homeroom@school.com', '$2b$12$4kA8mX3wQ1r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'homeroom_teacher', 'Mr. Johnson Homeroom', '251911444444', 'School Address'),
('guardian@example.com', '$2b$12$LQv3c1yqBvV1hGdVxF5KqY1KqY1KqY1KqY1KqY1KqY1KqY1KqY', 'guardian', 'John Doe', '251911555555', '123 Main St, Addis Ababa');

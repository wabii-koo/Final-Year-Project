-- Digital Parent-School Communication System Database Schema
-- MySQL 8.0+ compatible

-- Create database
CREATE DATABASE IF NOT EXISTS digital_school_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE digital_school_db;

-- Users Table
CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('director', 'registrar', 'teacher', 'homeroom_teacher', 'guardian') NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    phone_no VARCHAR(15) NOT NULL,
    address VARCHAR(255) NOT NULL,
    profile_image VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- GuardianRegistration Table
CREATE TABLE GuardianRegistration (
    registration_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    relationship_type ENUM('parent', 'legal_guardian') NOT NULL,
    document_path VARCHAR(255) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'correction_required') NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INT,
    reviewed_at DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
);

-- Classrooms Table
CREATE TABLE Classrooms (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    teacher_id INT NOT NULL,
    class_level VARCHAR(20) NOT NULL,
    homeroom_teacher_id INT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (homeroom_teacher_id) REFERENCES Users(user_id) ON DELETE RESTRICT,
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_homeroom_teacher_id (homeroom_teacher_id)
);

-- Students Table
CREATE TABLE Students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    guardian_id INT NOT NULL,
    class_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    emergency_contact VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guardian_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES Classrooms(class_id) ON DELETE RESTRICT,
    INDEX idx_guardian_id (guardian_id),
    INDEX idx_class_id (class_id)
);

-- Messages Table
CREATE TABLE Messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    read_at DATETIME,
    message_type ENUM('homework', 'general', 'report_card', 'pickup') DEFAULT 'general',
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_receiver_id (receiver_id),
    INDEX idx_sent_at (sent_at),
    INDEX idx_is_read (is_read)
);

-- Notifications Table
CREATE TABLE Notifications (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    priority ENUM('normal', 'emergency') NOT NULL DEFAULT 'normal',
    sender_id INT NOT NULL,
    recipient_group ENUM('all_guardians', 'all_teachers', 'specific_class', 'specific_users') NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    scheduled_for DATETIME,
    sent_at DATETIME,
    delivery_status ENUM('pending', 'sent', 'failed') DEFAULT 'pending',
    FOREIGN KEY (sender_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_delivery_status (delivery_status)
);

-- Events Table
CREATE TABLE Events (
    event_id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    event_date DATETIME NOT NULL,
    event_type ENUM('exam', 'meeting', 'holiday', 'activity', 'other') NOT NULL,
    location VARCHAR(255),
    created_by INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    target_audience ENUM('all', 'guardians_only', 'teachers_only', 'specific_class') DEFAULT 'all',
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type),
    INDEX idx_created_by (created_by)
);

-- Homework Table
CREATE TABLE Homework (
    homework_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    teacher_id INT NOT NULL,
    subject VARCHAR(50) NOT NULL,
    instructions TEXT NOT NULL,
    due_date DATE,
    assigned_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_subject (subject),
    INDEX idx_due_date (due_date)
);

-- HomeworkTracking Table
CREATE TABLE HomeworkTracking (
    tracking_id INT PRIMARY KEY AUTO_INCREMENT,
    homework_id INT NOT NULL,
    guardian_id INT NOT NULL,
    viewed_at DATETIME,
    feedback TEXT,
    feedback_given_at DATETIME,
    status ENUM('assigned', 'viewed', 'completed') DEFAULT 'assigned',
    FOREIGN KEY (homework_id) REFERENCES Homework(homework_id) ON DELETE CASCADE,
    FOREIGN KEY (guardian_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_homework_id (homework_id),
    INDEX idx_guardian_id (guardian_id),
    INDEX idx_status (status)
);

-- ReportCards Table
CREATE TABLE ReportCards (
    reportcard_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    term VARCHAR(20) NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    filled_by INT NOT NULL,
    filled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'unlocked') DEFAULT 'pending',
    approved_by INT,
    approved_at DATETIME,
    edit_timestamp DATETIME,
    subjects_grades JSON,
    teacher_comments TEXT,
    principal_comments TEXT,
    attendance_record JSON,
    conduct_grade VARCHAR(50),
    overall_grade VARCHAR(50),
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (filled_by) REFERENCES Users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (approved_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_term (term),
    INDEX idx_academic_year (academic_year),
    INDEX idx_status (status)
);

-- PickupRequests Table
CREATE TABLE PickupRequests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    guardian_id INT NOT NULL,
    authorized_person_name VARCHAR(100) NOT NULL,
    authorized_person_relationship VARCHAR(50) NOT NULL,
    authorized_person_phone VARCHAR(15) NOT NULL,
    authorized_person_national_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    request_date DATE NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time_start VARCHAR(20),
    pickup_time_end VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_by INT,
    processed_at DATETIME,
    notes TEXT,
    FOREIGN KEY (student_id) REFERENCES Students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (guardian_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_guardian_id (guardian_id),
    INDEX idx_status (status),
    INDEX idx_pickup_date (pickup_date)
);

-- NotificationDelivery Table
CREATE TABLE NotificationDelivery (
    delivery_id INT PRIMARY KEY AUTO_INCREMENT,
    notification_id INT NOT NULL,
    user_id INT NOT NULL,
    delivery_method ENUM('in_app', 'email', 'sms') NOT NULL,
    status ENUM('pending', 'delivered', 'failed', 'read') DEFAULT 'pending',
    sent_at DATETIME,
    read_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (notification_id) REFERENCES Notifications(notification_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    INDEX idx_notification_id (notification_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
);

-- SystemLogs Table
CREATE TABLE SystemLogs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at),
    INDEX idx_table_record (table_name, record_id)
);

-- Insert sample data for testing
INSERT INTO Users (email, password_hash, role, full_name, phone_no, address) VALUES
('director@school.com', '$2b$12$LQv3c1yqBvV1hGdVxF5KqY1KqY1KqY1KqY1KqY1KqY1KqY1KqY', 'director', 'School Director', '251911111111', 'School Address'),
('registrar@school.com', '$2b$12$92VUNxDfQ1r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'registrar', 'School Registrar', '251911222222', 'School Address'),
('teacher@school.com', '$2b$12$7xY9zW2vQ3r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'homeroom_teacher', 'Ms. Smith Teacher', '251911333333', 'School Address'),
('homeroom@school.com', '$2b$12$4kA8mX3wQ1r8s9L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8L8', 'homeroom_teacher', 'Mr. Johnson Homeroom', '251911444444', 'School Address'),
('guardian@example.com', '$2b$12$LQv3c1yqBvV1hGdVxF5KqY1KqY1KqY1KqY1KqY1KqY1KqY1KqY', 'guardian', 'John Doe', '251911555555', '123 Main St, Addis Ababa');

-- Insert sample classroom
INSERT INTO Classrooms (teacher_id, class_level, homeroom_teacher_id, academic_year) VALUES
(3, 'KG1-A', 3, '2024');

-- Insert sample student
INSERT INTO Students (guardian_id, class_id, full_name, dob, emergency_contact) VALUES
(4, 1, 'Jane Doe', '2018-05-15', '251911444444');

-- Create views for common queries
CREATE VIEW GuardianStudents AS
SELECT 
    s.student_id,
    s.full_name AS student_name,
    s.dob,
    s.emergency_contact,
    u.full_name AS guardian_name,
    u.email AS guardian_email,
    u.phone_no AS guardian_phone,
    c.class_level,
    c.academic_year
FROM Students s
JOIN Users u ON s.guardian_id = u.user_id
JOIN Classrooms c ON s.class_id = c.class_id
WHERE u.is_active = TRUE;

CREATE VIEW UnreadMessages AS
SELECT 
    m.message_id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.sent_at,
    m.message_type,
    u_sender.full_name AS sender_name,
    u_sender.role AS sender_role,
    u_receiver.full_name AS receiver_name
FROM Messages m
JOIN Users u_sender ON m.sender_id = u_sender.user_id
JOIN Users u_receiver ON m.receiver_id = u_receiver.user_id
WHERE m.is_read = FALSE;

CREATE VIEW PendingNotifications AS
SELECT 
    n.notification_id,
    n.title,
    n.content,
    n.priority,
    n.created_at,
    u.full_name AS sender_name,
    n.recipient_group
FROM Notifications n
JOIN Users u ON n.sender_id = u.user_id
WHERE n.delivery_status = 'pending';

-- Triggers for audit logging
DELIMITER //
CREATE TRIGGER log_user_changes
AFTER UPDATE ON Users
FOR EACH ROW
BEGIN
    INSERT INTO SystemLogs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (
        NEW.user_id,
        'USER_UPDATE',
        'Users',
        NEW.user_id,
        JSON_OBJECT(
            'email', OLD.email,
            'full_name', OLD.full_name,
            'phone_no', OLD.phone_no,
            'address', OLD.address
        ),
        JSON_OBJECT(
            'email', NEW.email,
            'full_name', NEW.full_name,
            'phone_no', NEW.phone_no,
            'address', NEW.address
        )
    );
END//
DELIMITER ;

-- Stored procedures for common operations
DELIMITER //
CREATE PROCEDURE GetGuardianStudents(IN guardian_id_param INT)
BEGIN
    SELECT 
        s.student_id,
        s.full_name,
        s.dob,
        c.class_level,
        c.academic_year,
        ht.full_name AS homeroom_teacher
    FROM Students s
    JOIN Classrooms c ON s.class_id = c.class_id
    JOIN Users ht ON c.homeroom_teacher_id = ht.user_id
    WHERE s.guardian_id = guardian_id_param;
END//
DELIMITER ;

DELIMITER //
CREATE PROCEDURE GetStudentHomework(IN student_id_param INT)
BEGIN
    SELECT 
        h.homework_id,
        h.subject,
        h.instructions,
        h.due_date,
        h.assigned_date,
        t.full_name AS teacher_name,
        ht.status,
        ht.viewed_at,
        ht.feedback
    FROM Homework h
    JOIN Users t ON h.teacher_id = t.user_id
    LEFT JOIN HomeworkTracking ht ON h.homework_id = ht.homework_id
    WHERE h.student_id = student_id_param
    ORDER BY h.assigned_date DESC;
END//
DELIMITER ;

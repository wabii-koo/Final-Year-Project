-- Add sample guardian welebe kebede and her children
-- This will make the Guardian Dashboard show real data

-- First, add or update the guardian welebe kebede
INSERT INTO Users (email, password_hash, role, full_name, phone_no, address) VALUES
('welebe@parent.com', '$2a$12$SOiM3NGued44FGHC1fr5ge.oI3L0trZvCxQzuHHDvMOIFPlNa8wj6', 'guardian', 'welebe kebede', '251912345678', 'Bole, Addis Ababa')
ON DUPLICATE KEY UPDATE 
full_name = 'welebe kebede',
phone_no = '251912345678',
address = 'Bole, Addis Ababa';

-- Get the guardian_id for welebe kebede
SET @guardian_id = (SELECT user_id FROM Users WHERE email = 'welebe@parent.com' AND role = 'guardian');

-- Insert children for welebe kebede
INSERT INTO Students (guardian_id, class_id, full_name, dob, emergency_contact, grade, class_name) VALUES
(@guardian_id, 1, 'Selam Kebede', '2018-03-15', '251912345678', 'KG1', 'KG1-A'),
(@guardian_id, 1, 'Mekdes Kebede', '2019-07-20', '251912345678', 'KG2', 'KG2-B')
ON DUPLICATE KEY UPDATE
guardian_id = @guardian_id;

-- Add sample homework assignments
INSERT INTO Homework (title, description, subject, class_name, due_date, teacher_id, is_active) VALUES
('Practice Letters A-Z', 'Practice writing uppercase and lowercase letters A-Z', 'English', 'KG1-A', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 3, 1),
('Count to 20', 'Practice counting numbers from 1 to 20 with objects', 'Mathematics', 'KG1-A', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 3, 1),
('Draw Your Family', 'Draw a picture of your family members', 'Art', 'KG2-B', DATE_ADD(CURDATE(), INTERVAL 4 DAY), 3, 1)
ON DUPLICATE KEY UPDATE
is_active = 1;

-- Add sample notifications
INSERT INTO Notifications (title, content, recipient_group, priority, sender_id, delivery_status, sent_at) VALUES
('School Holiday Notice', 'School will be closed next Monday for Ethiopian holiday', 'all', 'normal', 1, 'sent', NOW()),
('Parent-Teacher Meeting', 'Reminder: Parent-teacher meeting this Friday at 2:00 PM', 'guardians', 'normal', 2, 'sent', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('KG1 Field Trip', 'KG1 students will have a field trip to the zoo next Wednesday', 'guardians', 'normal', 2, 'sent', DATE_SUB(NOW(), INTERVAL 2 DAY))
ON DUPLICATE KEY UPDATE
sent_at = NOW();

-- Add sample pickup requests
INSERT INTO Pickup_Requests (student_id, guardian_id, authorized_person, relationship, pickup_time, status, request_date) VALUES
((SELECT student_id FROM Students WHERE full_name = 'Selam Kebede'), @guardian_id, 'Abebe Kebede', 'Father', '3:30 PM', 'pending', CURDATE()),
((SELECT student_id FROM Students WHERE full_name = 'Mekdes Kebede'), @guardian_id, 'Tigist Kebede', 'Aunt', '3:30 PM', 'approved', DATE_SUB(CURDATE(), INTERVAL 1 DAY))
ON DUPLICATE KEY UPDATE
request_date = CURDATE();

-- Update the classroom assignments to ensure they exist
INSERT INTO Classrooms (class_id, class_level, homeroom_teacher_id, academic_year) VALUES
(1, 'KG1-A', 3, '2026'),
(2, 'KG2-B', 3, '2026')
ON DUPLICATE KEY UPDATE
homeroom_teacher_id = 3;

-- Show the results
SELECT 'Guardian and sample data created successfully!' as status;

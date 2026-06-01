-- Updated sample data with unique password hashes for each staff member
-- Passwords:
-- Director: director123
-- Registrar: registrar456  
-- Teacher: teacher789
-- Homeroom Teacher: homeroom012
-- Guardian: password (parents create their own)

-- Use UPSERT to update existing passwords safely instead of deleting and failing on foreign keys
INSERT INTO "Users" (email, password_hash, role, full_name, phone_no, address) VALUES
('director@school.com', '$2a$12$2om7bmmjSIl8N0EhUs.ot.gujZ30EhCR5aXKyYC0DHAAj/rIcFpxW', 'director', 'School Director', '251911111111', 'School Address'),
('registrar@school.com', '$2a$12$ptqM7M.7S6z1PCmZJZAazegBAcE01c.VWkzo7DtT3M0Z0RvFDSocm', 'registrar', 'School Registrar', '251911222222', 'School Address'),
('teacher@school.com', '$2a$12$6mzM3kz0d4MdEuXQxz4jpO7ApsfhRglf4ISnzdFqwb3x5/ejUG53W', 'homeroom_teacher', 'Ms. Smith Teacher', '251911333333', 'School Address'),
('homeroom@school.com', '$2a$12$.qxJ2HVefB4JmbYCtxOgO.oYQajwQmtWgEBN8ubs66MBzqUTsPdmi', 'homeroom_teacher', 'Mr. Johnson Homeroom', '251911444444', 'School Address'),
('guardian@example.com', '$2a$12$SOiM3NGued44FGHC1fr5ge.oI3L0trZvCxQzuHHDvMOIFPlNa8wj6', 'guardian', 'John Doe', '251911555555', '123 Main St, Addis Ababa')
ON CONFLICT (email) DO UPDATE SET 
password_hash = EXCLUDED.password_hash;

-- Update classroom assignments (assuming teacher_id is the serial ID, be careful with manual IDs)
-- INSERT INTO "Classrooms" (teacher_id, class_level, homeroom_teacher_id, academic_year) VALUES
-- (3, 'KG1-A', 4, '2026')
-- ON CONFLICT (class_id) DO NOTHING;




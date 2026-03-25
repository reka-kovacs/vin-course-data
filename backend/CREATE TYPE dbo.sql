CREATE TYPE dbo.CourseProgressType AS TABLE (
    participant_id INT,
    course_id INT,
    course_title VARCHAR(MAX),
    first_accessed DATETIMEOFFSET(7),
    last_accessed DATETIMEOFFSET(7),
    completion FLOAT
);
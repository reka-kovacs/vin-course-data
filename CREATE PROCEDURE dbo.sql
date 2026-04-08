CREATE PROCEDURE dbo.UpsertCourseProgress
      @CourseProgressData dbo.CourseProgressType READONLY
    AS
    BEGIN
        MERGE dbo.CourseProgress AS target
        USING @CourseProgressData AS source
        ON target.participant_id = source.participant_id
          AND target.course_id = source.course_id

        WHEN MATCHED THEN
            UPDATE SET 
                course_title = source.course_title,
                first_accessed = source.first_accessed,
                last_accessed = source.last_accessed,
                completion = source.completion
        WHEN NOT MATCHED THEN
            INSERT (participant_id, course_id, course_title, first_accessed, last_accessed, completion)
            VALUES (source.participant_id, source.course_id, source.course_title, source.first_accessed, source.last_accessed, source.completion)
            
            OUTPUT $action AS action;
    END;
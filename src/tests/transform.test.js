import { transform } from "../transform.js";

describe("transform", () => {
  const mockDoc = {
    participant_data: {
      participant_id: 123,
      date_first_accessed: 1587627404714,
      date_last_accessed: 1587627404714,
      course_completion: 0.85,
    },
    course_data: {
      course_id: 4209,
      title: "Course Title",
    },
  };

  test("maps fields correctly", () => {
    const [result] = transform([mockDoc]);

    expect(result.participant_id).toBe(123);
    expect(result.course_id).toBe(4209);
    expect(result.course_title).toBe("Course Title");
    expect(result.first_accessed.getTime()).toBe(1587627404714);
    expect(result.last_accessed.getTime()).toBe(1587627404714);
    expect(result.completion).toBe(0.85);
  });

  test("converts timestamp to Date", () => {
    const [result] = transform([mockDoc]);

    expect(result.first_accessed).toBeInstanceOf(Date);
    expect(result.last_accessed).toBeInstanceOf(Date);
  });

  test("handles null completion", () => {
    const doc = {
      ...mockDoc,
      participant_data: {
        ...mockDoc.participant_data,
        course_completion: null,
      },
    };

    const [result] = transform([doc]);

    expect(result.completion).toBeNull();
  });

  test("skips malformed records", () => {
    const badDoc = {};

    const result = transform([badDoc]);

    expect(result.length).toBe(0);
  });
});

const url = "https://windbornesystems.com/career_applications.json";

const body = {
  career_application: {
    name: "Jacob Thompson",
    email: "jacob.s.thompson@icloud.com",
    role: "Junior Web Developer",
    notes: "Frontend Web Developer specializing in UI/UX design and Graphic Design",
    submission_url: "https://windborne-x-burgerking-jacobthompson.vercel.app/",
    portfolio_url: "https://jacobthompson-design.webflow.io/",
    resume_url: "https://www.linkedin.com/in/jacob-thompson-346b422ab/overlay/1760681747459/single-media-viewer/?profileId=ACoAAEq9x2YBtd3__BXbDgUR4aGX6gONnBZvaTE"
  }
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(body)
})
  .then(response => response.json())
  .then(data => console.log("Success:", data))
  .catch(error => console.error("Error:", error));

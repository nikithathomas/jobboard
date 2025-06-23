import { useState, useEffect } from "react";

const jobsApi = "https://hacker-news.firebaseio.com/v0/jobstories.json";
const getJobDescApi = (jobId) =>
  `https://hacker-news.firebaseio.com/v0/item/${jobId}.json`;

// Job Component
function Job({ job }) {
  return (
    <li className="jobboard-job">
      {job.title ? (
        job.url ? (
          // display a link to the job if the url is available
          <a
            href={job.url}
            target="_blank"
            className="jobboard-job__link jobboard-job__title"
          >
            {job.title}
          </a>
        ) : (
          <h2 className="jobboard-job__title">{job.title}</h2>
        )
      ) : (
        <h2 className="jobboard-job__title">{job.id}</h2>
      )}
      <section className="jobboard-job__desc">
        {job.by ? <p className="jobboard-job__creator">By {job.by}</p> : ""}
        {job.time ? (
          <p className="jobboard-job__date">{new Date(job.time).toString()}</p>
        ) : (
          ""
        )}
      </section>
    </li>
  );
}

// Main component
export default function App() {
  const [jobs, setJobs] = useState([]);
  const [visibleJobs, setVisibleJobs] = useState([]);

  function loadVisibleJobs() {
    let visibleJobsArray = [];

    if (jobs.length) {
      if (visibleJobs.length) {
        // if jobs are visible decide what must be shown and how much
        const visibleJobsLength = visibleJobs.length;
        const availableJobs =
          jobs.length < visibleJobsLength + 6
            ? jobs.length
            : visibleJobsLength + 6;
        visibleJobsArray.push(...jobs.slice(visibleJobsLength, availableJobs));
      } else {
        // if jobs are not visible display the first 6 of the jobs
        visibleJobsArray.push(...jobs.slice(0, 6));
      }

      // create a promise array of the recent jobs to be made visible
      const promiseArray = visibleJobsArray.map((visibleJob) =>
        fetch(getJobDescApi(visibleJob))
      );

      // once all promises are settled get the specific job descriptions for display
      Promise.allSettled(promiseArray).then((responses) => {
        const jsonResponses = responses.map((response) =>
          response.value.json()
        );
        const modifiedVisibleJobs = [...visibleJobs];

        Promise.allSettled(jsonResponses).then((jobDescs) => {
          jobDescs.forEach((jobDesc, index) => {
            modifiedVisibleJobs.push(jobDesc.value);

            if (index === jobDescs.length - 1) {
              setVisibleJobs(modifiedVisibleJobs);
            }
          });
        });
      });
    }
  }

  useEffect(() => {
    fetch(jobsApi).then((response) => {
      response.json().then((jobsList) => {
        // set the jobs obtained from the endpoint
        setJobs(jobsList);
      });
    });
  }, []);

  useEffect(() => {
    // load the first 6 jobs description after jobs array are obtained
    loadVisibleJobs();
  }, [jobs]);

  function handleLoadMoreClick() {
    // load the next 6 jobs description for display on click of load more
    loadVisibleJobs();
  }

  return (
    <div className="jobboard">
      <h1 className="jobboard-title">Hacker News Jobs Board</h1>
      {visibleJobs.length > 0 && (
        <ul className="jobboard-list">
          {visibleJobs.map((job, index) => {
            return <Job key={job.id} job={job}></Job>;
          })}
          {visibleJobs.length < jobs.length ? (
            <button
              onClick={handleLoadMoreClick}
              className="jobboard-list__loadmore"
            >
              Load more Jobs
            </button>
          ) : (
            ""
          )}
        </ul>
      )}
    </div>
  );
}

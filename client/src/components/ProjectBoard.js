import { useEffect, useState } from 'react';
import axios from '../utils/axios';

export default function ProjectBoard() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios.get('/projects')
      .then(res => setProjects(res.data))
      .catch(err => console.error('Failed to fetch projects:', err));
  }, []);

  return (
    <div>
      {projects.length === 0 ? (
        <p>No portfolio projects yet.</p>
      ) : (
        projects.map(project => (
          <div key={project.id} style={cardStyle}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            {project.link && <p><a href={project.link} target="_blank" rel="noreferrer">View Project</a></p>}
            <p><strong>Tech Stack:</strong> {project.tech_stack}</p>
          </div>
        ))
      )}
    </div>
  );
}

const cardStyle = {
  border: '1px solid #ccc',
  padding: '1rem',
  borderRadius: '5px',
  marginBottom: '1rem',
  background: '#f9f9f9'
};

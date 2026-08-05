import db from "./db";

export type Profile = {
  id: 1;
  name: string;
  bio: string;
  avatar_url: string;
  linkedin_url: string;
  youtube_url: string;
  github_url: string;
  x_url: string;
};

async function ensureProfileExists() {
    const { rows } = await db.query("SELECT id FROM profile WHERE id = 1");
    if (rows.length === 0) {
        await db.query(
            `INSERT INTO profile (id, name, bio, avatar_url, linkedin_url, youtube_url, github_url, x_url)
             VALUES (1, 'Dewa', 'Hi, I''m Dewa. Informatics student at UNDIP.\n\nI write about programming, AI, and things I learn while building projects.', '/profile.jpeg', '#', '#', '#', '#')
             ON CONFLICT (id) DO NOTHING`
        );
    }
}

export async function getProfile(): Promise<Profile> {
  await ensureProfileExists();
  const { rows } = await db.query("SELECT * FROM profile WHERE id = 1");
  return rows[0];
}

export async function updateProfile(input: Omit<Profile, "id">): Promise<Profile> {
  const { rows } = await db.query(
    `UPDATE profile SET name=$1, bio=$2, avatar_url=$3,
     linkedin_url=$4, youtube_url=$5, github_url=$6, x_url=$7
     WHERE id = 1
     RETURNING *`,
    [
      input.name,
      input.bio,
      input.avatar_url,
      input.linkedin_url,
      input.youtube_url,
      input.github_url,
      input.x_url,
    ]
  );
  return rows[0];
}

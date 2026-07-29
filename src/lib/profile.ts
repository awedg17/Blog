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

export function getProfile(): Profile {
  return db.prepare("SELECT * FROM profile WHERE id = 1").get() as Profile;
}

export function updateProfile(input: Omit<Profile, "id">): Profile {
  db.prepare(
    `UPDATE profile SET name=@name, bio=@bio, avatar_url=@avatar_url,
     linkedin_url=@linkedin_url, youtube_url=@youtube_url, github_url=@github_url, x_url=@x_url
     WHERE id = 1`
  ).run(input);
  return getProfile();
}

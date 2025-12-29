-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. profiles
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('student', 'teacher')),
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. chapters
create table chapters (
  id serial primary key,
  name text not null unique,
  order_index int default 0
);

-- 3. concepts
create table concepts (
  id text primary key, -- Using text ID from CSV (e.g., 'MenhDe')
  name text,
  chapter_id int references chapters(id) on delete set null,
  prerequisites jsonb default '[]'::jsonb -- Array of concept_ids
);

-- 4. questions
create table questions (
  id text primary key, -- Using text ID from CSV
  concept_id text references concepts(id) on delete cascade not null,
  content_text text,
  options jsonb, -- Array of strings or objects, correct answer handling implied elsewhere or here? 
                 -- Requirement: "options: 4 choices, exactly 1 correct". 
                 -- We'll store: [{"text": "...", "is_correct": boolean}] or just strings and separate correct_index.
                 -- Let's stick to simple: JSON object { "choices": [...], "correct_index": 0 } or similar.
                 -- Prompt says: "options: 4 choices, exactly 1 correct".
                 -- I will store as JSONB: [{"text": "A", "is_correct": true}, ...]
  difficulty_elo int not null
);
create index idx_questions_concept_id on questions(concept_id);

-- 5. student_mastery
create table student_mastery (
  user_id uuid references auth.users(id) on delete cascade not null,
  concept_id text references concepts(id) on delete cascade not null,
  current_elo int not null default 0,
  total_attempts int default 0,
  is_mastered boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, concept_id)
);
create index idx_student_mastery_user_id on student_mastery(user_id);

-- Consistency Check Trigger (Optional but good practice)
create or replace function update_mastery_status()
returns trigger as $$
begin
  if new.current_elo >= 1250 then
    new.is_mastered = true;
  else
    new.is_mastered = false;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tr_maintain_mastery_status
before insert or update on student_mastery
for each row execute function update_mastery_status();


-- 6. learning_logs
create table learning_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  question_id text references questions(id) on delete set null,
  concept_id text references concepts(id) on delete set null,
  is_correct boolean not null,
  old_elo int not null,
  new_elo int not null,
  elo_change int not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
create index idx_learning_logs_user_id_created_at on learning_logs(user_id, created_at);


-- RLS POLICIES
alter table profiles enable row level security;
alter table chapters enable row level security;
alter table concepts enable row level security;
alter table questions enable row level security;
alter table student_mastery enable row level security;
alter table learning_logs enable row level security;

-- Profiles: Public read (or authenticated read), update own
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Chapters/Concepts/Questions: Readable by all authenticated users
create policy "Chapters viewable by authenticated" on chapters for select to authenticated using (true);
create policy "Concepts viewable by authenticated" on concepts for select to authenticated using (true);
create policy "Questions viewable by authenticated" on questions for select to authenticated using (true);

-- Student Mastery: Students read/update own, Teachers read all
create policy "Students view own mastery" on student_mastery for select to authenticated 
using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create policy "Students update own mastery" on student_mastery for update to authenticated
using (auth.uid() = user_id);

create policy "Teachers view all mastery" on student_mastery for select to authenticated
using (exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

-- Learning Logs: Students read own, Teachers read all. Insert by student (or system)
create policy "Students view own logs" on learning_logs for select to authenticated
using (auth.uid() = user_id or exists (select 1 from profiles where id = auth.uid() and role = 'teacher'));

create policy "Students insert own logs" on learning_logs for insert to authenticated
with check (auth.uid() = user_id);


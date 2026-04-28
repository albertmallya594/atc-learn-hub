-- Roles enum and table (separate from profiles for security)
CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  username TEXT UNIQUE,
  program TEXT,
  year_of_study INT,
  avatar_url TEXT,
  bio TEXT,
  reputation INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  view_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE public.vote_target AS ENUM ('question', 'answer');
CREATE TYPE public.vote_kind AS ENUM ('up', 'down');

CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type vote_target NOT NULL,
  target_id UUID NOT NULL,
  value vote_kind NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);

CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security definer role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_answers_updated BEFORE UPDATE ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile + assign student role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- categories
CREATE POLICY "Categories viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- questions
CREATE POLICY "Questions viewable by everyone" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users create questions" ON public.questions FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own questions" ON public.questions FOR UPDATE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users delete own questions" ON public.questions FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- answers
CREATE POLICY "Answers viewable by everyone" ON public.answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users create answers" ON public.answers FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own answers or accept" ON public.answers FOR UPDATE USING (
  auth.uid() = author_id 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (SELECT 1 FROM public.questions q WHERE q.id = question_id AND q.author_id = auth.uid())
);
CREATE POLICY "Users delete own answers" ON public.answers FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- votes
CREATE POLICY "Votes viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Users create own votes" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.votes FOR DELETE USING (auth.uid() = user_id);

-- comments
CREATE POLICY "Comments viewable by everyone" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users update own comments" ON public.comments FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- notifications
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_on_answer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q_author UUID; q_title TEXT;
BEGIN
  SELECT author_id, title INTO q_author, q_title FROM public.questions WHERE id = NEW.question_id;
  IF q_author IS NOT NULL AND q_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, message, link)
    VALUES (q_author, 'answer', 'New answer on your question: ' || q_title, '/questions/' || NEW.question_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_answer AFTER INSERT ON public.answers
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_answer();

CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE a_author UUID; q_id UUID;
BEGIN
  SELECT author_id, question_id INTO a_author, q_id FROM public.answers WHERE id = NEW.answer_id;
  IF a_author IS NOT NULL AND a_author <> NEW.author_id THEN
    INSERT INTO public.notifications (user_id, type, message, link)
    VALUES (a_author, 'comment', 'New comment on your answer', '/questions/' || q_id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- Seed categories
INSERT INTO public.categories (name, slug, description, icon, color) VALUES
  ('Programming', 'programming', 'Code, languages, frameworks, debugging', 'Code2', 'hsl(217, 91%, 60%)'),
  ('Networking', 'networking', 'Networks, protocols, configuration', 'Network', 'hsl(160, 70%, 45%)'),
  ('Database', 'database', 'SQL, design, optimization', 'Database', 'hsl(280, 60%, 55%)'),
  ('Mathematics', 'mathematics', 'Calculus, algebra, statistics', 'Sigma', 'hsl(25, 90%, 55%)'),
  ('Engineering', 'engineering', 'Mechanical, electrical, civil engineering', 'Wrench', 'hsl(0, 70%, 55%)'),
  ('General Discussion', 'general', 'Anything else academic', 'MessageSquare', 'hsl(215, 25%, 45%)');
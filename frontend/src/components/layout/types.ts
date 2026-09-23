export interface NavLink {
  path: string;
  icon: string; // ex: 'ph-squares-four'
  label: string;
  badge?: number;
}

export interface NavSection {
  title: string;
  links: NavLink[];
}

export interface UserProfileData {
  initials: string;
  name: string;
  role?: string;
}

import { Avatar } from './Avatar';

export function ProfileAvatar({
  name,
  image,
  size = 40,
  className = '',
}: {
  name: string | null;
  image: string | null;
  size?: 40 | 80;
  className?: string;
}) {
  return (
    <Avatar
      image={image}
      size={size}
      className={className}
      label={
        image
          ? name
            ? `Foto de ${name}`
            : 'Foto de perfil'
          : name
            ? `Avatar padrão de ${name}`
            : 'Avatar padrão'
      }
    />
  );
}

import Image from 'react-bootstrap/Image';

export function ProfileAvatar({
  name,
  image,
  className = 'person-avatar',
}: {
  name: string | null;
  image: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      {image ? (
        <Image src={image} alt={name ? `Foto de ${name}` : 'Foto de perfil'} roundedCircle />
      ) : (
        name?.slice(0, 1).toUpperCase() ?? <i className="bi bi-person" />
      )}
    </div>
  );
}

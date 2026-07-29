type Link = { label: string; href: string };

export default function SocialLinks({ links }: { links: Link[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-ink transition-colors duration-150 hover:text-olive"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

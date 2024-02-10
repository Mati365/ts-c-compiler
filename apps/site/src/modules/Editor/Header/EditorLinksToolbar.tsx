import { BiLogoGithub } from 'react-icons/bi';
import { useI18n } from 'i18n';

export const EditorLinksToolbar = () => {
  const t = useI18n().pack.header;

  return (
    <ol className="flex flex-row place-content-end gap-2">
      <li>
        <a
          href="https://github.com/Mati365/ts-c-compiler"
          target="_blank"
          rel="noreferrer noopener"
          title={t.links.github}
          className="text-gray-500"
        >
          <BiLogoGithub size={38} />
        </a>
      </li>
    </ol>
  );
};

import { Button } from 'flowbite-react';
import { BiLogoGithub, BiPause, BiPlay } from 'react-icons/bi';

import { useI18n } from 'i18n';

export const EditorHeader = () => {
  const t = useI18n().pack.header;

  return (
    <header
      className="color-red flex w-full flex-row items-center justify-between border-b
border-gray-200 bg-white px-4 py-2 align-middle"
    >
      <ol className="flex flex-row gap-2">
        <li>
          <Button color="blue" size="sm">
            {t.run}

            <BiPlay size={24} className="relative top-[1px] ml-1" />
          </Button>
        </li>

        <li>
          <Button disabled color="gray" size="sm">
            {t.stop}

            <BiPause size={24} className="relative top-[1px] ml-1" />
          </Button>
        </li>
      </ol>

      <ol className="flex flex-row gap-2">
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
    </header>
  );
};

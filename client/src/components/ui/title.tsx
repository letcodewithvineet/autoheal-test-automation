import { Helmet } from "react-helmet-async";

interface TitleProps {
  title: string;
  description?: string;
}

export function Title({ title, description }: TitleProps) {
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
    </Helmet>
  );
}

export default Title;
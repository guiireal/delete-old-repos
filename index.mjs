import { Octokit } from "@octokit/rest";
import dotenv from "dotenv";

dotenv.config();

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

(async () => {
  try {
    console.log("Obtendo repositórios...");

    const repos = [];
    let page = 1;

    while (true) {
      const { data } = await octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        page,
      });

      if (data.length === 0) break;
      repos.push(...data);
      page++;
    }

    console.log(`Total de repositórios encontrados: ${repos.length}`);

    const forkRepos = repos.filter((repo) => repo.fork && !repo.private);

    console.log(`Forks públicos encontrados: ${forkRepos.length}`);

    for (const repo of forkRepos) {
      const repoAge = new Date() - new Date(repo.created_at);
      const repoAgeInDays = repoAge / (1000 * 60 * 60 * 24);

      if (repoAgeInDays > 365 * 2) {
        if (!repo.name.includes("ckfinder")) {
          await octokit.repos.delete({
            owner: repo.owner.login,
            repo: repo.name,
          });
        }
        console.log(`Repositório ${repo.full_name} excluído com sucesso.`);
      } else {
        console.log(`Mantendo repositório: ${repo.full_name}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("Processo concluído!");
  } catch (error) {
    console.error("Erro ao executar o script:", error);
  }
})();

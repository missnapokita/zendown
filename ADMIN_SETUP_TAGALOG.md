# Zenhub Admin setup

## 1. I-upload muna ang website

I-upload sa root ng GitHub repository ang lahat ng files na nasa `zen-app-store` folder. I-enable ang GitHub Pages gamit ang `main` branch at `/ (root)`.

Pagkatapos, ang admin URL ay:

```text
https://GITHUB-USERNAME.github.io/REPOSITORY-NAME/admin.html
```

## 2. Gumawa ng restricted token

Sa GitHub:

1. Pumunta sa **Settings → Developer settings**.
2. Buksan ang **Personal access tokens → Fine-grained tokens**.
3. Gumawa ng bagong token at lagyan ng expiration.
4. Sa **Repository access**, piliin lamang ang repository ng Zenhub website.
5. Sa **Repository permissions**, itakda ang **Contents** sa **Read and write**.
6. Huwag magbigay ng ibang permission kung hindi kailangan.

Huwag ilagay ang token sa `apps.json`, `apps.js`, o ibang public file. Sa Zenhub Admin login field mo lamang ito i-paste. Nasa kasalukuyang browser tab lamang ito habang ginagamit mo ang admin.

## 3. Ikonekta ang admin

Ilagay sa connection form:

- **Owner:** GitHub username mo, halimbawa `missnapokita`
- **Repository:** pangalan ng repository na pinag-uploadan ng Zenhub
- **Branch:** `main`
- **Data file:** `apps.json`
- **Fine-grained access token:** restricted token mula sa step 2

Pindutin ang **Connect & load data**. Kapag successful, magiging active ang **Publish to Zenhub**.

Automatic na chine-check ng admin ang tunay na default branch (`main`, `master`, o iba pa). Hahanapin din nito ang `apps.json` kung nailagay ang website sa loob ng subfolder gaya ng `zen-app-store/apps.json`.

## 4. Magdagdag o mag-edit ng app

Pindutin ang **Add app**, pagkatapos ay ilagay ang:

- App name at unique App ID
- Developer at category
- Icon image link
- Description
- Version, file size, required Android version, at package name
- APK direct download link
- What's New
- Screenshot image links, titles, at captions

Pindutin ang **Save app**, pagkatapos ay **Publish to Zenhub** para lumabas online ang pagbabago.

## 5. Backup

Gamitin ang **Download backup** bago gumawa ng malaking pagbabago. Maaari itong ibalik gamit ang **Import backup**, pagkatapos ay i-publish ulit.

## Paalala

Static ang GitHub Pages. Hindi secure ang password na direktang nakasulat sa HTML o JavaScript dahil nababasa ito sa public source. Ang restricted GitHub token ang tunay na authorization sa pag-publish; walang token, walang makakapag-save sa repository.

## Kapag may HTTP 404 sa publish

1. Gumawa o i-edit ulit ang fine-grained token.
2. Sa **Repository access**, piliin ang eksaktong repository ng Zenhub website.
3. Sa **Repository permissions**, gawing **Read and write** ang **Contents**.
4. Bumalik sa admin, pindutin ang **Disconnect**, at kumonekta ulit gamit ang bagong token.
5. Hayaang awtomatikong itama ng admin ang Branch at Data file fields.

Ang bagong admin version ay hindi na basta ituturing na “missing file” ang lahat ng 404. Ive-verify muna nito ang token, repository, branch, at aktuwal na lokasyon ng `apps.json`, at magpapakita ng eksaktong target bago mag-publish.

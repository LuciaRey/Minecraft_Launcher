async function getError() {
  let err = await window.electronAPI.error("type");
  let content = document.getElementById("error");
  switch (err) {
    case "nickname":
      content.innerHTML =
        '<a href="https://ely.by">Аккаунт с данным ником не существует<br /><br />Зарегистрируйтесь на сайте https://ely.by</a>';
      break;
    case "password":
      content.innerHTML = "<h4>Введен неверный пароль</h4>";
      break;
    default:
      content.innerHTML = "<h4>Ошибка подключения к серверу</h4>";
  }
}

getError();

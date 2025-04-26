import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import styles from "./page-container.module.css";
import { useNavigate, useSearchParams } from "react-router-dom";

// Using Vite environment variables
const API_ENDPOINTS = {
  login: import.meta.env.VITE_API_LOGIN_URL || "http://localhost:8000/api/login/",
  register: import.meta.env.VITE_API_REGISTER_URL || "http://localhost:8000/api/register/",
  completedBets: import.meta.env.VITE_API_COMPLETED_BETS_URL || "http://localhost:8000/api/completed-bets"
};

const PageContainer = ({ className = "", onLoginSuccess = () => {} }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  // Form states
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(initialMode === "login");
  const [agreementError, setAgreementError] = useState("");

  // Sync mode when URL parameter changes
  useEffect(() => {
    const currentMode = searchParams.get("mode") === "register" ? "register" : "login";
    setIsLoginMode(currentMode === "login");
  }, [searchParams]);



  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Password validation
  const validatePassword = (password) => password.length >= 8;

  // Reset errors when form changes
  useEffect(() => {
    if (formError) setFormError("");
    if (formSuccess) setFormSuccess("");
    if (agreementError) setAgreementError("");
  }, [formData, isAgreed, isLoginMode]);

  // Field change handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Agreement checkbox handler
  const handleAgreementChange = (e) => {
    setIsAgreed(e.target.checked);
    if (e.target.checked) setAgreementError("");
  };

  // Form submission handler - backend integration and token storage
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic field validation
    if (!formData.email || !formData.password) {
      setFormError("Пожалуйста, заполните все обязательные поля");
      return;
    }
    // Uncomment if needed
    // if (!validateEmail(formData.email)) {
    //   setFormError("Пожалуйста, введите корректный email");
    //   return;
    // }
    if (!validatePassword(formData.password)) {
      setFormError("Пароль должен содержать минимум 8 символов");
      return;
    }
    if (!isLoginMode && formData.password !== formData.confirmPassword) {
      setFormError("Пароли не совпадают");
      return;
    }
    if (!isLoginMode && !isAgreed) {
      setAgreementError("Необходимо принять условия соглашения для продолжения регистрации");
      document.getElementById("agreementCheckbox")?.focus();
      return;
    }

    setFormError("");
    setAgreementError("");
    setIsLoading(true);

    try {
      const endpoint = isLoginMode ? API_ENDPOINTS.login : API_ENDPOINTS.register;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();
      console.log(data);
      console.log("fetched resource");

      if (!response.ok) {
        setFormError(data.message || "Ошибка при запросе");
      } else {
        // Save tokens to localStorage
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);

        setFormSuccess(isLoginMode ? "Вход выполнен успешно!" : "Регистрация успешно завершена!");
        onLoginSuccess(data);

        // Reset form after registration
        if (!isLoginMode) {
          setFormData({ email: "", password: "", confirmPassword: "" });
          setIsAgreed(false);
        }
      }
    } catch (error) {
      console.error("Ошибка запроса:", error);
      setFormError("Произошла ошибка при обработке запроса");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompletedBets = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.completedBets}?limit=3`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
        }
      });

      const data = await response.json();
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching completed bets:", error);
      throw error;
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === 'password') setShowPassword(!showPassword);
    else if (field === 'confirmPassword') setShowConfirmPassword(!showConfirmPassword);
  };

  // Toggle between login and registration modes with URL update
  const toggleMode = () => {
    const newMode = isLoginMode ? "register" : "login";
    navigate(`?mode=${newMode}`, { replace: true });
    setFormData({ email: "", password: "", confirmPassword: "" });
    setFormError("");
    setFormSuccess("");
    setAgreementError("");
    setIsAgreed(false);
  };

  return (
      <form className={`${styles.pageContainer} ${className}`} onSubmit={handleSubmit}>
        {/* Header and top section */}
        <div className={styles.authContainer}>
          <div className={styles.authInnerContainer} onClick={() => navigate("/")}>
            <img
                className={styles.spacerIcon}
                loading="lazy"
                alt=""
                src="/vector-arro.svg"
            />
          </div>
          <div className={styles.registrationFormParent}>
            <div className={styles.registrationForm}>
              <img
                  className={styles.spacerIcon1}
                  loading="lazy"
                  alt=""
                  src="/vector-1.svg"
              />
            </div>
            <div className={styles.credentials}>
              <div className={styles.registrationLabel}>
                <h1 className={styles.h1}>{isLoginMode ? "Вход" : "Регистрация"}</h1>
              </div>
              <div className={styles.loginLabel}>
                <div className={styles.div}>
                  {isLoginMode ? "Еще нет аккаунта?" : "Уже зарегистрированы?"}
                </div>
                <div
                    className={styles.registrationBtn}
                    onClick={toggleMode}
                    role="button"
                    tabIndex={0}
                >
                  <div className={styles.div1}>{isLoginMode ? "Регистрация" : "Войти"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error or success message */}
        {formError && <div className={styles.formError}>{formError}</div>}
        {formSuccess && <div className={styles.formSuccess}>{formSuccess}</div>}

        {/* Email field */}
        <div className={styles.emailInput}>
          <div className={styles.stringEmail}>
            <input
                className={styles.email}
                placeholder="Email *"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
            />
          </div>
        </div>

        {/* Password field */}
        <div className={styles.credentials}>
          <div className={styles.stringPassword}>
            <input
                className={styles.input}
                placeholder="Пароль *"
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
            />
            <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => togglePasswordVisibility('password')}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>

          {/* Confirm password field (registration only) */}
          {!isLoginMode && (
              <div className={styles.stringPassword}>
                <input
                    className={styles.input}
                    placeholder="Подтвердите пароль *"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                />
                <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => togglePasswordVisibility('confirmPassword')}
                    aria-label={showConfirmPassword ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
          )}

          {/* Agreement checkbox (registration only) */}
          {!isLoginMode && (
              <div className={styles.agreement}>
                <div className={styles.agreementInner}>
                  <input
                      className={styles.agreementCheckbox}
                      type="checkbox"
                      checked={isAgreed}
                      onChange={handleAgreementChange}
                      id="agreementCheckbox"
                  />
                  <div className={styles.loginTreaty}>
                    <label htmlFor="agreementCheckbox" className={styles.div2}>
                      Я прочитал и принял соглашение:
                    </label>
                    <div
                        className={styles.div3}
                        onClick={() => console.log("Открытие договора о предоставлении услуг")}
                        role="link"
                        tabIndex={0}
                    >
                      Договор о предоставлении услуг
                    </div>
                  </div>
                </div>
                {/* Agreement error message */}
                {agreementError && (
                    <div className={`${styles.formError} ${styles.agreementError}`}>
                      {agreementError}
                    </div>
                )}
              </div>
          )}

          {/* Password reset link (login only) */}
          {isLoginMode && (
              <div className={styles.forgotPassword}>
                <div
                    className={styles.resetPasswordLink}
                    role="button"
                    tabIndex={0}
                    onClick={() => console.log("Запрос на восстановление пароля")}
                >
                  Забыли пароль?
                </div>
              </div>
          )}
        </div>

        {/* Action button (Login/Register) */}
        <div className={styles.registrationButton}>
          <button
              className={styles.enterBtn}
              type="submit"
              disabled={isLoading || (!isLoginMode && !isAgreed)}
              onClick={handleSubmit}
          >
            <b className={styles.b}>
              {isLoading
                  ? "ЗАГРУЗКА..."
                  : isLoginMode ? "ВОЙТИ" : "РЕГИСТРАЦИЯ"
              }
            </b>
          </button>
        </div>

        {/* "or" divider */}
        <div className={styles.dividerContainerWrapper}>
          <div className={styles.dividerContainer}>
            <div className={styles.divider}>
              <div className={styles.horizontalDivider}/>
            </div>
            <div className={styles.div4}>или</div>
            <div className={styles.divider}>
              <div className={styles.horizontalDivider}/>
            </div>
          </div>
        </div>

        {/* Google login button */}
        <div className={styles.dividerContainerWrapper}>
          <button
              className={styles.googleBtn}
              type="button"
              onClick={() => console.log("Google авторизация")}
          >
            <img
                className={styles.googleBtnImgIcon}
                alt="Google"
                src="/googlebtnimg.svg"
            />
            <div className={styles.google}>
              {isLoginMode ? "Вход через аккаунт Google" : "Регистрация через Google"}
            </div>
          </button>
        </div>
      </form>
  );
};

PageContainer.propTypes = {
  className: PropTypes.string,
  onLoginSuccess: PropTypes.func
};

export default PageContainer;
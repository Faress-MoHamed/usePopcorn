import { useEffect, useRef, useState } from "react";
import StarRating from "./StarRating";

// const tempMovieData = [
// 	{
// 		imdbID: "tt1375666",
// 		Title: "Inception",
// 		Year: "2010",
// 		Poster:
// 			"https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
// 	},
// 	{
// 		imdbID: "tt0133093",
// 		Title: "The Matrix",
// 		Year: "1999",
// 		Poster:
// 			"https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
// 	},
// 	{
// 		imdbID: "tt6751668",
// 		Title: "Parasite",
// 		Year: "2019",
// 		Poster:
// 			"https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_SX300.jpg",
// 	},
// ];

// const tempWatchedData = [
// 	{
// 		imdbID: "tt1375666",
// 		Title: "Inception",
// 		Year: "2010",
// 		Poster:
// 			"https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg",
// 		runtime: 148,
// 		imdbRating: 8.8,
// 		userRating: 10,
// 	},
// 	{
// 		imdbID: "tt0088763",
// 		Title: "Back to the Future",
// 		Year: "1985",
// 		Poster:
// 			"https://m.media-amazon.com/images/M/MV5BZmU0M2Y1OGUtZjIxNi00ZjBkLTg1MjgtOWIyNThiZWIwYjRiXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
// 		runtime: 116,
// 		imdbRating: 8.5,
// 		userRating: 9,
// 	},
// ];

export default function App() {
	const [query, setQuery] = useState("");
	const [movies, setMovies] = useState([]);
	const [watched, setWatched] = useState(() => {
		const storedValue = localStorage.getItem("watched");
		return storedValue ? JSON.parse(storedValue) : [];
	});
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [selectedId, setSelectedId] = useState(null);
	const k = "8f72318d";
	useEffect(
		function () {
			const controller = new AbortController();
			async function fetchMovies() {
				try {
					setIsLoading(true);
					setError("");
					const res = await fetch(
						`http://www.omdbapi.com/?apikey=${k}&s=${encodeURIComponent(
							query
						)}`,
						{ signal: controller.signal }
					);
					if (!res.ok) {
						throw new Error("something went wrong");
					}
					const data = await res.json();
					if (data.Error) {
						throw new Error("Movie not found");
					}
					setMovies(data.Search);
					setError("");
				} catch (err) {
					if (err.name !== "AbortError") setError(err.message);
				} finally {
					setIsLoading(false);
				}
			}
			if (query.length < 3) {
				setMovies([]);
				setError("");
				return;
			}
			fetchMovies();
			return function () {
				controller.abort();
			};
		},
		[query]
	);
	useEffect(() => {
		localStorage.setItem("watched", JSON.stringify(watched));
	}, [watched]);
	function handlerSelectedId(id) {
		setSelectedId((selectedId) => (id === selectedId ? null : id));
	}
	function handleCloseMovie() {
		setSelectedId(null);
	}
	function handleAddWatch(movie) {
		setWatched((watched) => [...watched, movie]);

		// localStorage.setItem("watched", JSON.stringify([...watched, movie]));
	}
	function handleDeleteWatched(id) {
		setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
	}

	return (
		<>
			{/* navbar component */}
			<Navbar>
				<Logo></Logo>
				<Search query={query} setQuery={setQuery}></Search>
				<NumResult movies={movies}></NumResult>
			</Navbar>
			{/* Main component */}
			<Main>
				<Box>
					{isLoading && <Loader></Loader>}
					{!isLoading && !error && (
						<MovieList movies={movies}>
							{movies?.map((movie) => (
								<Movie
									handlerSelectedId={handlerSelectedId}
									movie={movie}
									key={movie.imdbID}
								></Movie>
							))}
						</MovieList>
					)}
					{error && <ErrorMessage message={error}></ErrorMessage>}
				</Box>
				<Box>
					{selectedId ? (
						<MovieDetails
							onCloseMovie={handleCloseMovie}
							selectedId={selectedId}
							onAddWatched={handleAddWatch}
							k={k}
							watched={watched}
						></MovieDetails>
					) : (
						<>
							<WatchedSummary watched={watched}></WatchedSummary>
							<WatchedMovieList
								onRemove={handleDeleteWatched}
								watched={watched}
							></WatchedMovieList>
						</>
					)}
				</Box>
			</Main>
		</>
	);
}
const average = (arr) =>
	arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

function Main({ children }) {
	return (
		<main className="main">
			{/* box container component */}
			{children}
		</main>
	);
}
// ///////////////navbar components///////////////////////////
function Navbar({ children }) {
	return <nav className="nav-bar">{children}</nav>;
}
function Logo() {
	return (
		<div className="logo">
			<span role="img">🍿</span>
			<h1>usePopcorn</h1>
		</div>
	);
}
function NumResult({ movies }) {
	return (
		<p className="num-results">
			Found <strong>{!movies ? "0" : movies.length}</strong> results
		</p>
	);
}
function Search({ query, setQuery }) {
	const inputEl = useRef(null);
	useEffect(() => {
		function callback(e) {
			if (document.activeElement === inputEl.current) return;
			if (e.code === "Enter") inputEl.current.focus();
			setQuery("");
		}
		document.addEventListener("keydown", callback);
		return () => document.addEventListener("keydown", callback);
	}, [setQuery]);
	return (
		<input
			className="search"
			type="text"
			placeholder="Search movies..."
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			ref={inputEl}
		/>
	);
}
// ///////////////////////////////////////////////////
function Box({ children }) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className="box">
			{/* button componenr */}
			<button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
				{isOpen ? "–" : "+"}
			</button>
			{isOpen && children}
		</div>
	);
}
function Loader() {
	return <p className="loader">loading ...</p>;
}
function ErrorMessage({ message }) {
	return (
		<p className="error">
			<span>⛔</span>
			{message}
		</p>
	);
}

function MovieList({ children }) {
	return <ul className="list list-movies">{children}</ul>;
}
function Movie({ movie, handlerSelectedId }) {
	return (
		<li onClick={() => handlerSelectedId(movie.imdbID)}>
			<img src={movie.Poster} alt={`${movie.Title} poster`} />
			<h3>{movie.Title}</h3>
			<div>
				<p>
					<span>🗓</span>
					<span>{movie.Year}</span>
				</p>
			</div>
		</li>
	);
}
function MovieDetails({ watched, onAddWatched, k, onCloseMovie, selectedId }) {
	const [movie, setMovie] = useState({});
	const [isLoading, setIsLoading] = useState(false);
	const [userRating, setUserRating] = useState("");
	const {
		Title: title,
		Year: year,
		Poster: poster,
		Runtime: runtime,
		imdbRating,
		Plot: plot,
		Released: released,
		Actors: actors,
		Director: director,
		Genre: genre,
	} = movie;
	useEffect(() => {
		const callback = (e) => {
			if (e.code === "Escape") {
				onCloseMovie();
			}
		};
		document.addEventListener("keydown", callback);
		return function () {
			document.removeEventListener("keydown", callback);
		};
	}, [onCloseMovie]);
	useEffect(
		function () {
			async function getMovieById() {
				setIsLoading(true);
				const res = await fetch(
					`http://www.omdbapi.com/?apikey=${k}&i=${encodeURIComponent(
						selectedId
					)}`
				);
				const data = await res.json();
				setMovie(data);
				setIsLoading(false);
			}
			getMovieById();
		},
		[selectedId, k]
	);

	const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId);
	const watchedUserRating = watched.find(
		(movie) => movie.imdbID === selectedId
	)?.userRating;
	function handleAdd() {
		const newWatchedMovie = {
			imdbID: selectedId,
			title,
			year,
			poster,
			imdbRating: Number(imdbRating),
			runtime: runtime.split(" ").at(0),
			userRating,
		};
		onAddWatched(newWatchedMovie);
		onCloseMovie();
	}
	useEffect(
		function () {
			if (!title) return;
			document.title = `Movie | ${title}`;
			return function () {
				document.title = "usePopcorn";
			};
		},
		[title]
	);
	return (
		<div className="details">
			{isLoading ? (
				<Loader></Loader>
			) : (
				<>
					<header>
						<button className="btn-back" onClick={onCloseMovie}>
							&larr;
						</button>
						<img src={poster} alt={`Poster of ${title} movie`} />
						<div className="details-overview">
							<h2>{title}</h2>
							<p>
								{released} &bull; {runtime}
							</p>
							<p>{genre}</p>
							<p>
								<span>⭐️</span>
								{imdbRating} IMDb rating
							</p>
						</div>
					</header>
					<section>
						<div className="rating">
							{isWatched ? (
								<p style={{ textAlign: "center" }}>
									you rated with movie &nbsp;{watchedUserRating}&nbsp;
									<span>🌟</span>
								</p>
							) : (
								<>
									<StarRating
										onSetRating={setUserRating}
										maxRating={10}
										size={24}
									></StarRating>
									{userRating && (
										<button className="btn-add" onClick={handleAdd}>
											+ Add to list
										</button>
									)}
								</>
							)}
						</div>
						<p>
							<em>{plot}</em>
						</p>
						<p>Starring {actors}</p>
						<p>Directed by {director}</p>
					</section>
				</>
			)}
		</div>
	);
}
function WatchedSummary({ watched }) {
	const avgImdbRating = average(watched.map((movie) => movie.imdbRating));
	const avgUserRating = average(watched.map((movie) => movie.userRating));
	const avgRuntime = average(watched.map((movie) => movie.runtime));
	return (
		<div className="summary">
			<h2>Movies you watched</h2>
			<div>
				<p>
					<span>#️⃣</span>
					<span>{watched.length} movies</span>
				</p>
				<p>
					<span>⭐️</span>
					<span>{avgImdbRating}</span>
				</p>
				<p>
					<span>🌟</span>
					<span>{avgUserRating}</span>
				</p>
				<p>
					<span>⏳</span>
					<span>{avgRuntime} min</span>
				</p>
			</div>
		</div>
	);
}
function WatchedMovieList({ onRemove, watched }) {
	return (
		<ul className="list">
			{watched.map((movie) => (
				<WatchedMovie
					onRemove={onRemove}
					key={movie.imdbID}
					movie={movie}
				></WatchedMovie>
			))}
		</ul>
	);
}
function WatchedMovie({ onRemove, movie }) {
	return (
		<li key={movie.imdbID}>
			<img src={movie.poster} alt={`${movie.Title} poster`} />
			<h3>{movie.title}</h3>
			<div>
				<p>
					<span>⭐️</span>
					<span>{movie.imdbRating.toFixed(2)}</span>
				</p>
				<p>
					<span>🌟</span>
					<span>{movie.userRating.toFixed(2)}</span>
				</p>
				<p>
					<span>⏳</span>
					<span>{movie.runtime} min</span>
				</p>
				<button className="btn-delete" onClick={() => onRemove(movie.imdbID)}>
					X
				</button>
			</div>
		</li>
	);
}

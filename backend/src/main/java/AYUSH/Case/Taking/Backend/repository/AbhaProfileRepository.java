package AYUSH.Case.Taking.Backend.repository;

import AYUSH.Case.Taking.Backend.entity.AbhaProfile;
import AYUSH.Case.Taking.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AbhaProfileRepository
        extends JpaRepository<AbhaProfile, Long> {

    Optional<AbhaProfile> findByUser(User user);

    Optional<AbhaProfile> findByUserId(Long userId);

    Optional<AbhaProfile> findByAbhaNumber(String abhaNumber);

    Optional<AbhaProfile> findByAbhaAddress(String abhaAddress);

    boolean existsByAbhaNumber(String abhaNumber);

    boolean existsByAbhaAddress(String abhaAddress);

    boolean existsByUserId(Long userId);
}